package services

import (
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
