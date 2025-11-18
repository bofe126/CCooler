package services

import (
	"ccooler/backend/models"
	"fmt"
	"os"
	"path/filepath"
	"syscall"
	"unsafe"
)

type CleanService struct{}

func NewCleanService() *CleanService {
	return &CleanService{}
}

// GetDiskInfo 获取C盘信息
func (s *CleanService) GetDiskInfo() (*models.DiskInfo, error) {
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	getDiskFreeSpaceEx := kernel32.NewProc("GetDiskFreeSpaceExW")

	var freeBytesAvailable, totalBytes, totalFreeBytes int64

	drive := "C:\\"
	drivePtr, _ := syscall.UTF16PtrFromString(drive)

	ret, _, _ := getDiskFreeSpaceEx.Call(
		uintptr(unsafe.Pointer(drivePtr)),
		uintptr(unsafe.Pointer(&freeBytesAvailable)),
		uintptr(unsafe.Pointer(&totalBytes)),
		uintptr(unsafe.Pointer(&totalFreeBytes)),
	)

	if ret == 0 {
		return nil, fmt.Errorf("failed to get disk info")
	}

	return &models.DiskInfo{
		Total: totalBytes,
		Free:  totalFreeBytes,
		Used:  totalBytes - totalFreeBytes,
	}, nil
}

// GetTempPath 获取临时文件路径
func (s *CleanService) GetTempPath() string {
	return os.TempDir()
}

// GetSystemTempPath 获取系统临时文件路径
func (s *CleanService) GetSystemTempPath() string {
	return `C:\Windows\Temp`
}

// GetRecycleBinPath 获取回收站路径
func (s *CleanService) GetRecycleBinPath() string {
	return `C:\$Recycle.Bin`
}

// GetBrowserCachePaths 获取浏览器缓存路径
func (s *CleanService) GetBrowserCachePaths() []string {
	localAppData := os.Getenv("LOCALAPPDATA")
	appData := os.Getenv("APPDATA")

	paths := []string{}

	// Chrome
	chromePath := filepath.Join(localAppData, `Google\Chrome\User Data\Default\Cache`)
	if _, err := os.Stat(chromePath); err == nil {
		paths = append(paths, chromePath)
	}

	// Edge
	edgePath := filepath.Join(localAppData, `Microsoft\Edge\User Data\Default\Cache`)
	if _, err := os.Stat(edgePath); err == nil {
		paths = append(paths, edgePath)
	}

	// Firefox
	firefoxPath := filepath.Join(appData, `Mozilla\Firefox\Profiles`)
	if _, err := os.Stat(firefoxPath); err == nil {
		// 查找 Firefox 配置文件
		entries, _ := os.ReadDir(firefoxPath)
		for _, entry := range entries {
			if entry.IsDir() {
				cachePath := filepath.Join(firefoxPath, entry.Name(), "cache2")
				if _, err := os.Stat(cachePath); err == nil {
					paths = append(paths, cachePath)
				}
			}
		}
	}

	return paths
}

// GetWindowsUpdateCachePath 获取 Windows 更新缓存路径
func (s *CleanService) GetWindowsUpdateCachePath() string {
	return `C:\Windows\SoftwareDistribution\Download`
}

// GetDownloadPath 获取下载目录路径
func (s *CleanService) GetDownloadPath() string {
	userProfile := os.Getenv("USERPROFILE")
	return filepath.Join(userProfile, "Downloads")
}

// CalculateFolderSize 计算文件夹大小
func (s *CleanService) CalculateFolderSize(path string) (int64, error) {
	var size int64

	err := filepath.Walk(path, func(_ string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // 忽略错误，继续
		}
		if !info.IsDir() {
			size += info.Size()
		}
		return nil
	})

	return size, err
}

// ScanCleanItems 扫描所有清理项
func (s *CleanService) ScanCleanItems() ([]*models.CleanItem, error) {
	items := []*models.CleanItem{
		{ID: "1", Name: "系统临时文件", Checked: true, Safe: true, Status: "scanning"},
		{ID: "2", Name: "浏览器缓存", Checked: true, Safe: true, Status: "idle"},
		{ID: "3", Name: "回收站", Checked: true, Safe: true, Status: "idle"},
		{ID: "4", Name: "Windows更新缓存", Checked: true, Safe: true, Status: "idle"},
		{ID: "5", Name: "系统文件清理", Checked: true, Safe: true, Status: "idle"},
		{ID: "6", Name: "下载目录", Checked: false, Safe: false, Status: "idle"},
		{ID: "7", Name: "应用缓存", Checked: false, Safe: false, Status: "idle"},
	}

	// 扫描每个项目的大小
	for i, item := range items {
		item.Status = "scanning"
		var size int64

		switch item.ID {
		case "1": // 系统临时文件
			tempPath := s.GetTempPath()
			tempSize, err := s.CalculateFolderSize(tempPath)
			if err == nil {
				size += tempSize
			}

			sysTempPath := s.GetSystemTempPath()
			sysSize, err := s.CalculateFolderSize(sysTempPath)
			if err == nil {
				size += sysSize
			}

		case "2": // 浏览器缓存
			paths := s.GetBrowserCachePaths()
			for _, path := range paths {
				pathSize, err := s.CalculateFolderSize(path)
				if err == nil {
					size += pathSize
				}
			}

		case "3": // 回收站
			recyclePath := s.GetRecycleBinPath()
			recycleSize, err := s.CalculateFolderSize(recyclePath)
			if err == nil {
				size = recycleSize
			}

		case "4": // Windows更新缓存
			updatePath := s.GetWindowsUpdateCachePath()
			updateSize, err := s.CalculateFolderSize(updatePath)
			if err == nil {
				size = updateSize
			}

		case "5": // 系统文件清理
			// Windows 错误报告
			werPath := `C:\ProgramData\Microsoft\Windows\WER`
			werSize, err := s.CalculateFolderSize(werPath)
			if err == nil {
				size += werSize
			}

			// 缩略图缓存
			thumbPath := filepath.Join(os.Getenv("LOCALAPPDATA"), `Microsoft\Windows\Explorer`)
			thumbSize, err := s.CalculateFolderSize(thumbPath)
			if err == nil {
				size += thumbSize
			}

		case "6": // 下载目录
			downloadPath := s.GetDownloadPath()
			downloadSize, err := s.CalculateFolderSize(downloadPath)
			if err == nil {
				size = downloadSize
			}

		case "7": // 应用缓存
			localAppData := os.Getenv("LOCALAPPDATA")
			// 扫描常见应用缓存
			cacheDirs := []string{
				filepath.Join(localAppData, "Temp"),
				filepath.Join(localAppData, "Microsoft", "Windows", "INetCache"),
			}
			for _, dir := range cacheDirs {
				dirSize, err := s.CalculateFolderSize(dir)
				if err == nil {
					size += dirSize
				}
			}
		}

		items[i].Size = size
		items[i].Status = "scanned"
	}

	return items, nil
}

// CleanFolder 清理文件夹（保留文件夹本身，只删除内容）
func (s *CleanService) CleanFolder(path string) error {
	// 检查路径是否存在
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return nil // 路径不存在，跳过
	}

	entries, err := os.ReadDir(path)
	if err != nil {
		return fmt.Errorf("无法读取目录 %s: %v", path, err)
	}

	var lastError error
	for _, entry := range entries {
		fullPath := filepath.Join(path, entry.Name())

		// 尝试删除，忽略单个文件的错误
		err := os.RemoveAll(fullPath)
		if err != nil {
			lastError = err
			// 继续删除其他文件
		}
	}

	return lastError
}

// CleanFolderSafe 安全清理文件夹（跳过正在使用的文件）
func (s *CleanService) CleanFolderSafe(path string) (int64, error) {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return 0, nil
	}

	var cleaned int64
	entries, err := os.ReadDir(path)
	if err != nil {
		return 0, err
	}

	for _, entry := range entries {
		fullPath := filepath.Join(path, entry.Name())

		// 获取文件/文件夹大小
		info, err := os.Stat(fullPath)
		if err != nil {
			continue
		}

		var itemSize int64
		if info.IsDir() {
			itemSize, _ = s.CalculateFolderSize(fullPath)
		} else {
			itemSize = info.Size()
		}

		// 尝试删除
		err = os.RemoveAll(fullPath)
		if err == nil {
			cleaned += itemSize
		}
	}

	return cleaned, nil
}

// EmptyRecycleBin 清空回收站
func (s *CleanService) EmptyRecycleBin() error {
	shell32 := syscall.NewLazyDLL("shell32.dll")
	emptyRecycleBin := shell32.NewProc("SHEmptyRecycleBinW")

	ret, _, _ := emptyRecycleBin.Call(
		0,
		0,
		0x00000001, // SHERB_NOCONFIRMATION
	)

	if ret != 0 {
		return fmt.Errorf("failed to empty recycle bin")
	}

	return nil
}
