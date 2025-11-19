package services

import (
	"ccooler/backend/models"
	"fmt"
	"os"
	"path/filepath"
	"sync"
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

	// 通用 Chromium 浏览器列表（支持所有主流浏览器）
	chromiumBrowsers := []struct {
		name     string
		basePath string
	}{
		{"Google\\Chrome", filepath.Join(localAppData, `Google\Chrome\User Data\Default`)},
		{"Microsoft\\Edge", filepath.Join(localAppData, `Microsoft\Edge\User Data\Default`)},
		{"BraveSoftware\\Brave-Browser", filepath.Join(localAppData, `BraveSoftware\Brave-Browser\User Data\Default`)},
		{"Vivaldi", filepath.Join(localAppData, `Vivaldi\User Data\Default`)},
		{"Yandex\\YandexBrowser", filepath.Join(localAppData, `Yandex\YandexBrowser\User Data\Default`)},
		{"360Chrome\\Chrome", filepath.Join(localAppData, `360Chrome\Chrome\User Data\Default`)},
		{"Tencent\\QQBrowser", filepath.Join(localAppData, `Tencent\QQBrowser\User Data\Default`)},
		{"Opera Software\\Opera Stable", filepath.Join(appData, `Opera Software\Opera Stable`)},
		{"SogouExplorer", filepath.Join(appData, `SogouExplorer\User Data\Default`)},
		{"UCBrowser", filepath.Join(localAppData, `UCBrowser\User Data\Default`)},
		{"Quark", filepath.Join(localAppData, `Quark\User Data\Default`)},
	}

	// 安全可清理的缓存目录（Chromium 通用）
	cacheDirs := []string{
		"Cache",          // HTTP 缓存
		"Code Cache",     // JS/CSS 编译缓存（通常最大）
		"GPUCache",       // GPU 缓存
		"Service Worker", // Service Worker 缓存
		// 注意：不包含 Extensions, IndexedDB, Local Storage 等，避免影响用户体验
	}

	// 扫描所有 Chromium 浏览器
	for _, browser := range chromiumBrowsers {
		if _, err := os.Stat(browser.basePath); err == nil {
			for _, dir := range cacheDirs {
				cachePath := filepath.Join(browser.basePath, dir)
				if _, err := os.Stat(cachePath); err == nil {
					paths = append(paths, cachePath)
				}
			}
		}
	}

	// Firefox（不同结构）
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

// CalculateFolderDetails 计算文件夹详细信息（大小、文件数、文件夹数）
func (s *CleanService) CalculateFolderDetails(path string) (int64, int, int, error) {
	var size int64
	var fileCount int
	var folderCount int
	var skippedCount int
	var accessDeniedCount int

	// 检查路径是否存在
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return 0, 0, 0, nil // 路径不存在，返回0
	}

	err := filepath.Walk(path, func(filePath string, info os.FileInfo, err error) error {
		if err != nil {
			skippedCount++
			// 检查是否是权限错误
			if os.IsPermission(err) {
				accessDeniedCount++
			}
			// 如果是目录访问错误，跳过整个目录
			if info != nil && info.IsDir() {
				return filepath.SkipDir
			}
			return nil // 跳过单个文件错误，继续
		}

		// 跳过符号链接，避免循环
		if info.Mode()&os.ModeSymlink != 0 {
			return nil
		}

		if info.IsDir() {
			// 统计文件夹（排除根目录本身）
			if filePath != path {
				folderCount++
			}
		} else {
			// 统计文件
			fileSize := info.Size()
			if fileSize >= 0 {
				size += fileSize
				fileCount++
			}
		}

		return nil
	})

	// 记录跳过的文件信息（用于调试）
	if skippedCount > 0 {
		fmt.Printf("Scan %s: files=%d, folders=%d, size=%d bytes, skipped=%d (access denied=%d)\n",
			path, fileCount, folderCount, size, skippedCount, accessDeniedCount)
	}

	return size, fileCount, folderCount, err
}

// ScanCleanItems 扫描所有清理项（并行扫描）
func (s *CleanService) ScanCleanItems() ([]*models.CleanItem, error) {
	items := []*models.CleanItem{
		{ID: "1", Name: "系统临时文件", Checked: true, Safe: true, Status: "idle"},
		{ID: "2", Name: "浏览器缓存", Checked: true, Safe: true, Status: "idle"},
		{ID: "3", Name: "回收站", Checked: true, Safe: true, Status: "idle"},
		{ID: "4", Name: "Windows更新缓存", Checked: true, Safe: true, Status: "idle"},
		{ID: "5", Name: "系统文件清理", Checked: true, Safe: true, Status: "idle"},
		{ID: "6", Name: "下载目录", Checked: false, Safe: false, Status: "idle"},
		{ID: "7", Name: "应用缓存", Checked: false, Safe: false, Status: "idle"},
	}

	// 使用 goroutine 并行扫描
	var wg sync.WaitGroup
	for i := range items {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			s.scanSingleItem(items[index])
		}(i)
	}
	wg.Wait()

	return items, nil
}

// scanSingleItem 扫描单个清理项
func (s *CleanService) scanSingleItem(item *models.CleanItem) {
	item.Status = "scanning"

	switch item.ID {
	case "1": // 系统临时文件
		paths := []string{
			s.GetTempPath(),
			s.GetSystemTempPath(),
		}
		s.scanPaths(item, paths)

	case "2": // 浏览器缓存
		paths := s.GetBrowserCachePaths()
		s.scanPaths(item, paths)

	case "3": // 回收站
		paths := []string{s.GetRecycleBinPath()}
		s.scanPaths(item, paths)

	case "4": // Windows更新缓存
		paths := []string{s.GetWindowsUpdateCachePath()}
		s.scanPaths(item, paths)

	case "5": // 系统文件清理
		paths := []string{
			`C:\ProgramData\Microsoft\Windows\WER`,
			filepath.Join(os.Getenv("LOCALAPPDATA"), `Microsoft\Windows\Explorer`),
			`C:\Windows\Prefetch`,
			`C:\Windows\Logs`,
			`C:\Windows\Installer`,                                    // MSI 安装文件（通常几百MB到几GB）
			`C:\ProgramData\Microsoft\Windows Defender\Scans\History`, // Defender 扫描历史
		}
		s.scanPaths(item, paths)

	case "6": // 下载目录
		paths := []string{s.GetDownloadPath()}
		s.scanPaths(item, paths)

	case "7": // 应用缓存
		localAppData := os.Getenv("LOCALAPPDATA")
		userProfile := os.Getenv("USERPROFILE")
		paths := []string{
			filepath.Join(localAppData, "Temp"),
			filepath.Join(localAppData, "Microsoft", "Windows", "INetCache"),
			filepath.Join(localAppData, "CrashDumps"),
			filepath.Join(localAppData, "Microsoft", "Windows", "WebCache"), // IE/Edge WebCache
			filepath.Join(localAppData, "Microsoft", "Windows", "Caches"),   // Windows 应用缓存
			filepath.Join(localAppData, "Packages"),                         // UWP 应用缓存（部分）
			filepath.Join(userProfile, ".gradle", "caches"),                 // Gradle 缓存
			filepath.Join(userProfile, ".m2", "repository"),                 // Maven 缓存
			filepath.Join(localAppData, "pip", "cache"),                     // Python pip 缓存
			filepath.Join(localAppData, "npm-cache"),                        // npm 缓存
		}
		s.scanPaths(item, paths)
	}

	item.Status = "scanned"
}

// scanPaths 扫描多个路径并汇总结果
func (s *CleanService) scanPaths(item *models.CleanItem, paths []string) {
	var totalSize int64
	var totalFiles int
	var pathDetails []models.PathDetail

	for _, path := range paths {
		size, fileCount, folderCount, err := s.CalculateFolderDetails(path)
		// 只要路径存在（err == nil），就记录，即使大小为0
		if err == nil {
			totalSize += size
			totalFiles += fileCount
			// 只记录有内容的路径到详情中
			if size > 0 {
				pathDetails = append(pathDetails, models.PathDetail{
					Path:        path,
					Size:        size,
					FileCount:   fileCount,
					FolderCount: folderCount,
				})
			}
		}
	}

	item.Size = totalSize
	item.FileCount = totalFiles
	item.Paths = pathDetails
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

// OpenFolder 使用资源管理器打开文件夹
func (s *CleanService) OpenFolder(path string) error {
	// 使用 Windows API 展开环境变量
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	expandEnvironmentStrings := kernel32.NewProc("ExpandEnvironmentStringsW")

	pathPtr, _ := syscall.UTF16PtrFromString(path)
	buffer := make([]uint16, 32768) // MAX_PATH 的扩展版本

	ret, _, _ := expandEnvironmentStrings.Call(
		uintptr(unsafe.Pointer(pathPtr)),
		uintptr(unsafe.Pointer(&buffer[0])),
		uintptr(len(buffer)),
	)

	if ret == 0 {
		return fmt.Errorf("无法展开环境变量: %s", path)
	}

	expandedPath := syscall.UTF16ToString(buffer)

	// 检查路径是否存在
	if _, err := os.Stat(expandedPath); os.IsNotExist(err) {
		return fmt.Errorf("路径不存在: %s", expandedPath)
	}

	// 使用 explorer 打开文件夹
	shell32 := syscall.NewLazyDLL("shell32.dll")
	shellExecute := shell32.NewProc("ShellExecuteW")

	operation, _ := syscall.UTF16PtrFromString("open")
	file, _ := syscall.UTF16PtrFromString("explorer.exe")
	params, _ := syscall.UTF16PtrFromString(expandedPath)

	ret2, _, _ := shellExecute.Call(
		0,
		uintptr(unsafe.Pointer(operation)),
		uintptr(unsafe.Pointer(file)),
		uintptr(unsafe.Pointer(params)),
		0,
		1, // SW_SHOWNORMAL
	)

	// ShellExecute 返回值 > 32 表示成功
	if ret2 <= 32 {
		return fmt.Errorf("无法打开文件夹: %s", expandedPath)
	}

	return nil
}
