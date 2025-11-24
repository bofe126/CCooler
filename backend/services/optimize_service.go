package services

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"unsafe"

	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
)

// SystemOptimizeType 系统优化项类型
type SystemOptimizeType string

const (
	OptimizeHibernation SystemOptimizeType = "hibernation" // 休眠文件
	OptimizePagefile    SystemOptimizeType = "pagefile"    // 虚拟内存
	OptimizeRestore     SystemOptimizeType = "restore"     // 系统还原点
)

// SystemOptimizeItem 系统优化项信息
type SystemOptimizeItem struct {
	Type        SystemOptimizeType `json:"type"`
	Name        string             `json:"name"`
	Description string             `json:"description"`
	Path        string             `json:"path"`
	Size        int64              `json:"size"`
	Enabled     bool               `json:"enabled"`
	CanDisable  bool               `json:"canDisable"`
}

// SystemOptimizeResult 系统优化扫描结果
type SystemOptimizeResult struct {
	Items     []SystemOptimizeItem `json:"items"`
	TotalSize int64                `json:"totalSize"`
}

// OptimizeService 系统优化服务
type OptimizeService struct{}

// NewOptimizeService 创建系统优化服务实例
func NewOptimizeService() *OptimizeService {
	return &OptimizeService{}
}

// Scan 扫描系统优化项
func (s *OptimizeService) Scan() (*SystemOptimizeResult, error) {
	items := []SystemOptimizeItem{}
	var totalSize int64

	// 1. 检查休眠文件
	hibernationItem := s.checkHibernation()
	if hibernationItem != nil {
		items = append(items, *hibernationItem)
		totalSize += hibernationItem.Size
	}

	// 2. 检查虚拟内存文件
	pagefileItem := s.checkPagefile()
	if pagefileItem != nil {
		items = append(items, *pagefileItem)
		totalSize += pagefileItem.Size
	}

	// 3. 检查系统还原点
	restoreItem := s.checkSystemRestore()
	if restoreItem != nil {
		items = append(items, *restoreItem)
		totalSize += restoreItem.Size
	}

	return &SystemOptimizeResult{
		Items:     items,
		TotalSize: totalSize,
	}, nil
}

// checkHibernation 检查休眠文件
func (s *OptimizeService) checkHibernation() *SystemOptimizeItem {
	path := "C:\\hiberfil.sys"

	// 检查文件是否存在
	info, err := os.Stat(path)
	if err != nil {
		// 文件不存在，说明休眠已禁用
		return &SystemOptimizeItem{
			Type:        OptimizeHibernation,
			Name:        "系统休眠文件",
			Description: "用于快速启动的休眠文件 (hiberfil.sys)，如果不使用休眠功能可以禁用",
			Path:        path,
			Size:        0,
			Enabled:     false,
			CanDisable:  false,
		}
	}

	return &SystemOptimizeItem{
		Type:        OptimizeHibernation,
		Name:        "系统休眠文件",
		Description: "用于快速启动的休眠文件 (hiberfil.sys)，如果不使用休眠功能可以禁用",
		Path:        path,
		Size:        info.Size(),
		Enabled:     true,
		CanDisable:  true,
	}
}

// checkPagefile 检查虚拟内存文件
func (s *OptimizeService) checkPagefile() *SystemOptimizeItem {
	path := "C:\\pagefile.sys"

	// 先检查注册表配置（更准确）
	psScript := `(Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management' -Name 'PagingFiles').PagingFiles`
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", psScript)
	output, err := cmd.CombinedOutput()

	// 如果注册表显示已禁用（空值或空数组）
	outputStr := string(output)
	if err == nil && (len(outputStr) == 0 || outputStr == "\r\n" || outputStr == "\n") {
		return &SystemOptimizeItem{
			Type:        OptimizePagefile,
			Name:        "虚拟内存文件",
			Description: "虚拟内存已禁用（重启后生效）",
			Path:        path,
			Size:        0,
			Enabled:     false,
			CanDisable:  false,
		}
	}

	// 检查文件是否存在
	info, err := os.Stat(path)
	if err != nil {
		return &SystemOptimizeItem{
			Type:        OptimizePagefile,
			Name:        "虚拟内存文件",
			Description: "系统虚拟内存文件 (pagefile.sys)，建议保留以保证系统稳定运行",
			Path:        path,
			Size:        0,
			Enabled:     false,
			CanDisable:  false,
		}
	}

	return &SystemOptimizeItem{
		Type:        OptimizePagefile,
		Name:        "虚拟内存文件",
		Description: "Windows 虚拟内存文件（pagefile.sys）- 不建议禁用，除非物理内存充足",
		Path:        path,
		Size:        info.Size(),
		Enabled:     true,
		CanDisable:  true, // 允许禁用，但前端会显示警告
	}
}

// checkSystemRestore 检查系统还原点
func (s *OptimizeService) checkSystemRestore() *SystemOptimizeItem {
	path := "C:\\System Volume Information"

	// 计算目录大小
	size := s.calculateDirSize(path)

	return &SystemOptimizeItem{
		Type:        OptimizeRestore,
		Name:        "系统还原点",
		Description: "系统还原点占用的空间，可以清理旧的还原点释放空间",
		Path:        path,
		Size:        size,
		Enabled:     size > 0,
		CanDisable:  size > 0,
	}
}

// calculateDirSize 计算目录大小
func (s *OptimizeService) calculateDirSize(path string) int64 {
	var size int64

	filepath.Walk(path, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // 忽略错误，继续遍历
		}
		if !info.IsDir() {
			size += info.Size()
		}
		return nil
	})

	return size
}

// Clean 清理/禁用系统优化项
func (s *OptimizeService) Clean(itemType SystemOptimizeType) error {
	switch itemType {
	case OptimizeHibernation:
		return s.disableHibernation()
	case OptimizeRestore:
		return s.cleanSystemRestore()
	case OptimizePagefile:
		return s.disablePagefile()
	default:
		return fmt.Errorf("未知的优化项类型: %s", itemType)
	}
}

// gbkToUtf8 将 GBK 编码转换为 UTF-8
func gbkToUtf8(s []byte) (string, error) {
	reader := transform.NewReader(bytes.NewReader(s), simplifiedchinese.GBK.NewDecoder())
	buf := new(bytes.Buffer)
	_, err := buf.ReadFrom(reader)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

// disableHibernation 禁用休眠
func (s *OptimizeService) disableHibernation() error {
	// 使用 powercfg 命令禁用休眠
	cmd := exec.Command("powercfg", "/hibernate", "off")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow: true,
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		// 转换 GBK 输出为 UTF-8
		outputStr, convErr := gbkToUtf8(output)
		if convErr != nil {
			outputStr = string(output) // 转换失败则使用原始输出
		}
		return fmt.Errorf("禁用休眠失败: %v, 输出: %s", err, outputStr)
	}

	return nil
}

// cleanSystemRestore 清理系统还原点
func (s *OptimizeService) cleanSystemRestore() error {
	// 使用 vssadmin 命令删除所有还原点
	// 注意：这需要管理员权限
	cmd := exec.Command("vssadmin", "delete", "shadows", "/all", "/quiet")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow: true,
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		// 转换 GBK 输出为 UTF-8
		outputStr, convErr := gbkToUtf8(output)
		if convErr != nil {
			outputStr = string(output) // 转换失败则使用原始输出
		}
		return fmt.Errorf("清理系统还原点失败: %v, 输出: %s", err, outputStr)
	}

	return nil
}

// disablePagefile 禁用虚拟内存（页面文件）
func (s *OptimizeService) disablePagefile() error {
	// 警告：禁用虚拟内存可能导致系统不稳定
	// 使用注册表方法禁用虚拟内存（更可靠）
	psScript := `
		# 禁用自动管理页面文件
		Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management' -Name 'PagingFiles' -Value ''
		
		# 设置为不自动管理
		$path = 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management'
		Set-ItemProperty -Path $path -Name 'PagingFiles' -Type MultiString -Value @()
	`

	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", psScript)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow: true,
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		// 转换 GBK 输出为 UTF-8
		outputStr, convErr := gbkToUtf8(output)
		if convErr != nil {
			outputStr = string(output)
		}
		return fmt.Errorf("禁用虚拟内存失败: %v, 输出: %s", err, outputStr)
	}

	return nil
}

// IsAdmin 检查是否有管理员权限
func (s *OptimizeService) IsAdmin() bool {
	shell32 := syscall.NewLazyDLL("shell32.dll")
	isUserAnAdmin := shell32.NewProc("IsUserAnAdmin")

	ret, _, _ := isUserAnAdmin.Call()
	return ret != 0
}

// RequestAdmin 请求管理员权限
func (s *OptimizeService) RequestAdmin() error {
	exe, err := os.Executable()
	if err != nil {
		return err
	}

	verb := "runas"
	verbPtr, _ := syscall.UTF16PtrFromString(verb)
	exePtr, _ := syscall.UTF16PtrFromString(exe)
	cwdPtr, _ := syscall.UTF16PtrFromString("")
	argPtr, _ := syscall.UTF16PtrFromString("")

	shell32 := syscall.NewLazyDLL("shell32.dll")
	shellExecute := shell32.NewProc("ShellExecuteW")

	ret, _, _ := shellExecute.Call(
		0,
		uintptr(unsafe.Pointer(verbPtr)),
		uintptr(unsafe.Pointer(exePtr)),
		uintptr(unsafe.Pointer(argPtr)),
		uintptr(unsafe.Pointer(cwdPtr)),
		1, // SW_SHOWNORMAL
	)

	if ret <= 32 {
		return fmt.Errorf("请求管理员权限失败")
	}

	return nil
}
