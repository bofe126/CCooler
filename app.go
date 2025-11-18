package main

import (
	"ccooler/backend/models"
	"ccooler/backend/services"
	"context"
)

// App struct
type App struct {
	ctx             context.Context
	cleanService    *services.CleanService
	softwareService *services.SoftwareService
	wechatService   *services.WeChatService
	adminService    *services.AdminService
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		cleanService:    services.NewCleanService(),
		softwareService: services.NewSoftwareService(),
		wechatService:   services.NewWeChatService(),
		adminService:    services.NewAdminService(),
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
			updatePath := a.cleanService.GetWindowsUpdateCachePath()
			err = a.cleanService.CleanFolder(updatePath)
			if err != nil {
				item.Status = "error"
				item.Error = "清理更新缓存失败（需要管理员权限）"
				continue
			}

		case "5": // 系统文件清理
			// Windows 错误报告
			werPath := `C:\ProgramData\Microsoft\Windows\WER`
			a.cleanService.CleanFolder(werPath)

			// 缩略图缓存
			localAppData := a.cleanService.GetTempPath()
			thumbPath := localAppData + `\..\Local\Microsoft\Windows\Explorer`
			a.cleanService.CleanFolder(thumbPath)

		case "6": // 下载目录
			downloadPath := a.cleanService.GetDownloadPath()
			err = a.cleanService.CleanFolder(downloadPath)
			if err != nil {
				item.Status = "error"
				item.Error = "清理下载目录失败: " + err.Error()
				continue
			}

		case "7": // 应用缓存
			localAppData := a.cleanService.GetTempPath()
			cacheDirs := []string{
				localAppData + `\..\Local\Temp`,
				localAppData + `\..\Local\Microsoft\Windows\INetCache`,
			}
			for _, dir := range cacheDirs {
				a.cleanService.CleanFolder(dir)
			}
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

// OpenFolder 打开文件夹
func (a *App) OpenFolder(path string) error {
	return a.cleanService.OpenFolder(path)
}
