package services

import (
	"os"
	"path/filepath"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

type AdminService struct{}

func NewAdminService() *AdminService {
	return &AdminService{}
}

// IsAdmin 检查当前进程是否以管理员权限运行
func (s *AdminService) IsAdmin() bool {
	var sid *windows.SID

	// 获取管理员组的 SID
	err := windows.AllocateAndInitializeSid(
		&windows.SECURITY_NT_AUTHORITY,
		2,
		windows.SECURITY_BUILTIN_DOMAIN_RID,
		windows.DOMAIN_ALIAS_RID_ADMINS,
		0, 0, 0, 0, 0, 0,
		&sid)
	if err != nil {
		return false
	}
	defer windows.FreeSid(sid)

	// 检查当前令牌是否包含管理员组
	token := windows.Token(0)
	member, err := token.IsMember(sid)
	if err != nil {
		return false
	}

	return member
}

// TOKEN_ELEVATION 结构体
type TOKEN_ELEVATION struct {
	TokenIsElevated uint32
}

// IsElevated 检查当前进程是否提升了权限
func (s *AdminService) IsElevated() bool {
	var token windows.Token
	err := windows.OpenProcessToken(windows.CurrentProcess(), windows.TOKEN_QUERY, &token)
	if err != nil {
		return false
	}
	defer token.Close()

	var elevation TOKEN_ELEVATION
	var returnedLen uint32
	err = windows.GetTokenInformation(
		token,
		windows.TokenElevation,
		(*byte)(unsafe.Pointer(&elevation)),
		uint32(unsafe.Sizeof(elevation)),
		&returnedLen,
	)
	if err != nil {
		return false
	}

	return elevation.TokenIsElevated != 0
}

// RestartAsAdmin 以管理员身份重启应用程序
func (s *AdminService) RestartAsAdmin() error {
	// 获取当前可执行文件的路径
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	// 解析符号链接（如果有）
	exePath, err = filepath.EvalSymlinks(exePath)
	if err != nil {
		return err
	}

	// 使用 ShellExecute 以管理员身份运行
	verb := "runas" // "runas" 会触发 UAC 提示
	cwd, _ := os.Getwd()

	// 转换为 UTF-16
	verbPtr, _ := syscall.UTF16PtrFromString(verb)
	exePtr, _ := syscall.UTF16PtrFromString(exePath)
	cwdPtr, _ := syscall.UTF16PtrFromString(cwd)

	// 调用 ShellExecute
	ret := shellExecute(0, verbPtr, exePtr, nil, cwdPtr, syscall.SW_NORMAL)
	if ret <= 32 {
		return syscall.Errno(ret)
	}

	// 退出当前进程
	os.Exit(0)
	return nil
}

// shellExecute 调用 Windows ShellExecute API
func shellExecute(hwnd uintptr, verb, file, args, dir *uint16, showCmd int) uintptr {
	ret, _, _ := syscall.NewLazyDLL("shell32.dll").NewProc("ShellExecuteW").Call(
		hwnd,
		uintptr(unsafe.Pointer(verb)),
		uintptr(unsafe.Pointer(file)),
		uintptr(unsafe.Pointer(args)),
		uintptr(unsafe.Pointer(dir)),
		uintptr(showCmd),
	)
	return ret
}
