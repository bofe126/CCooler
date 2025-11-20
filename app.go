package main

import (
	"ccooler/backend/models"
	"ccooler/backend/services"
	"context"
	"fmt"
	"os"
	"path/filepath"
)

// App struct
type App struct {
	ctx              context.Context
	cleanService     *services.CleanService
	softwareService  *services.SoftwareService
	wechatService    *services.WeChatService
	adminService     *services.AdminService
	largeFileService *services.LargeFileService
	optimizeService  *services.OptimizeService
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		cleanService:     services.NewCleanService(),
		softwareService:  services.NewSoftwareService(),
		wechatService:    services.NewWeChatService(),
		adminService:     services.NewAdminService(),
		largeFileService: services.NewLargeFileService(),
		optimizeService:  services.NewOptimizeService(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// GetDiskInfo 获取磁盘信息
func (a *App) GetDiskInfo() (*models.DiskInfo, error) {
	return a.cleanService.GetDiskInfo()
}

// ScanCleanItems 扫描清理项
func (a *App) ScanCleanItems() ([]*models.CleanItem, error) {
	return a.cleanService.ScanCleanItems()
}

// ScanSingleCleanItem 扫描单个清理项
func (a *App) ScanSingleCleanItem(itemID string) (*models.CleanItem, error) {
	// 创建清理项
	var item *models.CleanItem
	switch itemID {
	case "1":
		item = &models.CleanItem{ID: "1", Name: "系统临时文件", Checked: true, Safe: true, Status: "scanning"}
	case "2":
		item = &models.CleanItem{ID: "2", Name: "浏览器缓存", Checked: true, Safe: true, Status: "scanning"}
	case "3":
		item = &models.CleanItem{ID: "3", Name: "回收站", Checked: true, Safe: true, Status: "scanning"}
	case "4":
		item = &models.CleanItem{ID: "4", Name: "Windows更新缓存", Checked: true, Safe: true, Status: "scanning"}
	case "5":
		item = &models.CleanItem{ID: "5", Name: "系统文件清理", Checked: true, Safe: true, Status: "scanning"}
	case "6":
		item = &models.CleanItem{ID: "6", Name: "应用缓存", Checked: false, Safe: false, Status: "scanning"}
	case "7":
		item = &models.CleanItem{ID: "7", Name: "应用日志文件", Checked: false, Safe: false, Status: "scanning"}
	default:
		return nil, fmt.Errorf("unknown item ID: %s", itemID)
	}

	// 扫描单个项目
	a.cleanService.ScanSingleItem(item)
	return item, nil
}

// CleanItems 清理选中的项目
func (a *App) CleanItems(items []*models.CleanItem) error {
	for _, item := range items {
		if !item.Checked {
			continue
		}

		var err error

		switch item.ID {
		case "1": // 系统临时文件
			// 清理用户临时文件
			tempPath := a.cleanService.GetTempPath()
			err = a.cleanService.CleanFolder(tempPath)
			if err != nil {
				item.Status = "error"
				item.Error = "清理用户临时文件失败: " + err.Error()
				continue
			}

			// 清理系统临时文件（可能需要管理员权限）
			sysTempPath := a.cleanService.GetSystemTempPath()
			err = a.cleanService.CleanFolder(sysTempPath)
			if err != nil {
				item.Status = "error"
				item.Error = "清理系统临时文件失败（可能需要管理员权限）"
				continue
			}

		case "2": // 浏览器缓存
			paths := a.cleanService.GetBrowserCachePaths()
			hasError := false
			for _, path := range paths {
				err = a.cleanService.CleanFolder(path)
				if err != nil {
					hasError = true
				}
			}
			if hasError {
				item.Status = "error"
				item.Error = "部分浏览器缓存清理失败（浏览器可能正在运行）"
				continue
			}

		case "3": // 回收站
			err = a.cleanService.EmptyRecycleBin()
			if err != nil {
				item.Status = "error"
				item.Error = "清空回收站失败: " + err.Error()
				continue
			}

		case "4": // Windows更新缓存
			updatePaths := a.cleanService.GetWindowsUpdateCachePaths()
			hasError := false
			for _, path := range updatePaths {
				err = a.cleanService.CleanFolder(path)
				if err != nil {
					hasError = true
				}
			}
			if hasError {
				item.Status = "error"
				item.Error = "部分更新缓存清理失败（需要管理员权限）"
				continue
			}

		case "5": // 系统文件清理
			// 清理所有系统文件路径（与扫描逻辑严格一致）
			systemPaths := []string{
				`C:\ProgramData\Microsoft\Windows\WER`,
				filepath.Join(os.Getenv("LOCALAPPDATA"), `Microsoft\Windows\Explorer`),
				`C:\Windows\Prefetch`,
				`C:\Windows\Logs`,
				`C:\Windows\Installer`,
				`C:\ProgramData\Microsoft\Windows Defender\Scans\History`,
			}
			hasError := false
			var errorMsg string
			for _, path := range systemPaths {
				err = a.cleanService.CleanFolder(path)
				if err != nil {
					hasError = true
					errorMsg = "部分系统文件清理失败（可能需要管理员权限）"
				}
			}
			if hasError {
				item.Status = "error"
				item.Error = errorMsg
				continue
			}

		case "6": // 应用缓存
			// 清理所有应用缓存路径（与扫描逻辑严格一致）
			localAppData := os.Getenv("LOCALAPPDATA")
			userProfile := os.Getenv("USERPROFILE")
			cacheDirs := []string{
				filepath.Join(localAppData, "Temp"),
				filepath.Join(localAppData, "Microsoft", "Windows", "INetCache"),
				filepath.Join(localAppData, "CrashDumps"),
				filepath.Join(localAppData, "Microsoft", "Windows", "WebCache"),
				filepath.Join(localAppData, "Microsoft", "Windows", "Caches"),
				filepath.Join(localAppData, "Packages"),
				filepath.Join(userProfile, ".gradle", "caches"),
				filepath.Join(userProfile, ".m2", "repository"),
				filepath.Join(localAppData, "pip", "cache"),
				filepath.Join(localAppData, "npm-cache"),
			}
			hasError := false
			var errorMsg string
			for _, dir := range cacheDirs {
				err = a.cleanService.CleanFolder(dir)
				if err != nil {
					hasError = true
					errorMsg = "部分应用缓存清理失败（应用可能正在使用）"
				}
			}
			if hasError {
				item.Status = "error"
				item.Error = errorMsg
				continue
			}

		case "7": // 应用日志文件
			cleanedSize, cleanedCount, err := a.cleanService.CleanLogFiles()
			if err != nil {
				item.Status = "error"
				item.Error = "清理日志文件失败: " + err.Error()
				continue
			}
			// 记录清理结果
			item.Size = cleanedSize
			item.FileCount = cleanedCount
		}

		// 标记为完成
		item.Status = "completed"
	}

	return nil
}

// GetInstalledSoftware 获取已安装软件
func (a *App) GetInstalledSoftware() ([]*models.SoftwareInfo, error) {
	return a.softwareService.GetInstalledSoftware()
}

// DetectWeChat 检测微信
func (a *App) DetectWeChat() (*models.WeChatData, error) {
	return a.wechatService.DetectWeChat()
}

// OpenWeChat 打开微信
func (a *App) OpenWeChat() error {
	return a.wechatService.OpenWeChat()
}

// IsAdmin 检查是否有管理员权限
func (a *App) IsAdmin() bool {
	return a.adminService.IsAdmin()
}

// IsElevated 检查是否提升了权限
func (a *App) IsElevated() bool {
	return a.adminService.IsElevated()
}

// RestartAsAdmin 以管理员身份重启应用程序
func (a *App) RestartAsAdmin() error {
	return a.adminService.RestartAsAdmin()
}

// OpenFolder 打开文件夹
func (a *App) OpenFolder(path string) error {
	return a.cleanService.OpenFolder(path)
}

// ScanLargeFiles 扫描C盘大文件
func (a *App) ScanLargeFiles() (*services.ScanResult, error) {
	return a.largeFileService.ScanCDrive()
}

// DeleteLargeFile 删除大文件
func (a *App) DeleteLargeFile(path string) error {
	return a.largeFileService.DeleteFile(path)
}

// OpenLargeFileLocation 在资源管理器中打开大文件位置
func (a *App) OpenLargeFileLocation(path string) error {
	return a.largeFileService.OpenFileLocation(path)
}

// SetLargeFileMinSize 设置大文件最小大小（MB）
func (a *App) SetLargeFileMinSize(sizeInMB int64) {
	a.largeFileService.SetMinSize(sizeInMB)
}

// ScanSystemOptimize 扫描系统优化项
func (a *App) ScanSystemOptimize() (*services.SystemOptimizeResult, error) {
	return a.optimizeService.Scan()
}

// CleanSystemOptimizeItem 清理系统优化项
func (a *App) CleanSystemOptimizeItem(itemType string) error {
	return a.optimizeService.Clean(services.SystemOptimizeType(itemType))
}
