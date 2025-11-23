package services

import (
	"ccooler/backend/models"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
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

// GetWindowsUpdateCachePaths 获取 Windows 更新缓存路径（多个）
func (s *CleanService) GetWindowsUpdateCachePaths() []string {
	return []string{
		`C:\Windows\SoftwareDistribution\Download`,  // 更新下载文件
		`C:\Windows\SoftwareDistribution\DataStore`, // 更新历史数据库
		`C:\Windows\System32\catroot2`,              // 加密签名缓存
		// `C:\Windows\Logs\CBS` 已移至系统文件清理项（包含在 C:\Windows\Logs 中）
	}
}

// GetSystemFilePaths 获取系统文件清理路径
func (s *CleanService) GetSystemFilePaths() []string {
	return []string{
		`C:\ProgramData\Microsoft\Windows\WER`,
		filepath.Join(os.Getenv("LOCALAPPDATA"), `Microsoft\Windows\Explorer`),
		`C:\Windows\Prefetch`,
		`C:\Windows\Logs`,                                         // 系统日志（包含CBS、DISM、WindowsUpdate等）
		`C:\Windows\Installer`,                                    // MSI 安装文件（通常几百MB到几GB）
		`C:\ProgramData\Microsoft\Windows Defender\Scans\History`, // Defender 扫描历史
	}
}

// GetAppCachePaths 获取应用缓存路径
func (s *CleanService) GetAppCachePaths() []string {
	localAppData := os.Getenv("LOCALAPPDATA")
	userProfile := os.Getenv("USERPROFILE")
	return []string{
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
}

// ScanLogFiles 扫描常见日志目录中的 .log 文件（优化版本）
func (s *CleanService) ScanLogFiles() (int64, int, []string, error) {
	var totalSize int64
	var fileCount int

	// 按目录分组统计
	dirStats := make(map[string]struct {
		size  int64
		count int
	})

	// 定义常见的日志文件目录（平衡速度和覆盖率）
	userProfile := os.Getenv("USERPROFILE")
	localAppData := os.Getenv("LOCALAPPDATA")
	appData := os.Getenv("APPDATA")
	programData := os.Getenv("PROGRAMDATA")

	// 分组定义：不同目录使用不同的扫描深度
	type scanConfig struct {
		path     string
		maxDepth int
	}

	scanConfigs := []scanConfig{
		// 用户目录 - 深度扫描（5层）
		{filepath.Join(localAppData), 5},
		{filepath.Join(appData), 5},

		// 程序数据 - 深度扫描（5层）
		{programData, 5},

		// 临时目录 - 中度扫描（4层）
		{filepath.Join(localAppData, "Temp"), 4},
		{filepath.Join(userProfile, "AppData", "Local", "Temp"), 4},
		{"C:\\Temp", 4},
		{"C:\\tmp", 4},

		// 用户文档和桌面 - 浅度扫描（2层，避免扫描太多个人文件）
		{filepath.Join(userProfile, "Desktop"), 2},
		{filepath.Join(userProfile, "Documents"), 2},
		{filepath.Join(userProfile, "Downloads"), 2},

		// 常见软件安装目录 - 中度扫描（4层）
		{"C:\\Program Files", 4},
		{"C:\\Program Files (x86)", 4},

		// 用户根目录下的常见位置 - 浅度扫描（3层）
		{filepath.Join(userProfile, ".config"), 3},
		{filepath.Join(userProfile, ".cache"), 3},
		{filepath.Join(userProfile, ".local"), 3},
	}

	// 扫描每个目录
	for _, config := range scanConfigs {
		if _, err := os.Stat(config.path); os.IsNotExist(err) {
			continue // 目录不存在，跳过
		}

		s.scanLogFilesInDir(config.path, 0, config.maxDepth, dirStats, &totalSize, &fileCount)
	}

	// 提取有日志文件的目录路径并按大小排序
	type dirInfo struct {
		path  string
		size  int64
		count int
	}

	var sortedDirs []dirInfo
	for dir, stats := range dirStats {
		sortedDirs = append(sortedDirs, dirInfo{
			path:  dir,
			size:  stats.size,
			count: stats.count,
		})
	}

	// 按大小排序
	sort.Slice(sortedDirs, func(i, j int) bool {
		return sortedDirs[i].size > sortedDirs[j].size
	})

	// 提取路径（限制数量）
	var logPaths []string
	maxPaths := 50
	for _, dir := range sortedDirs {
		if len(logPaths) >= maxPaths {
			break
		}
		logPaths = append(logPaths, dir.path)
	}

	return totalSize, fileCount, logPaths, nil
}

// scanLogFilesInDir 递归扫描目录中的日志文件（带深度限制）
func (s *CleanService) scanLogFilesInDir(dir string, currentDepth, maxDepth int, dirStats map[string]struct {
	size  int64
	count int
}, totalSize *int64, fileCount *int) {
	if currentDepth > maxDepth {
		return
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return // 无权限或其他错误，跳过
	}

	for _, entry := range entries {
		fullPath := filepath.Join(dir, entry.Name())

		if entry.IsDir() {
			// 跳过一些明显不包含日志的目录（减少跳过项，提高覆盖率）
			name := entry.Name()
			if name == "node_modules" || name == ".git" || name == "$Recycle.Bin" ||
				name == "System Volume Information" {
				continue
			}

			// 递归扫描子目录
			s.scanLogFilesInDir(fullPath, currentDepth+1, maxDepth, dirStats, totalSize, fileCount)
		} else if filepath.Ext(entry.Name()) == ".log" {
			// 找到日志文件
			info, err := entry.Info()
			if err != nil {
				continue
			}

			size := info.Size()
			*totalSize += size
			*fileCount++

			// 按父目录分组
			parentDir := filepath.Dir(fullPath)
			stats := dirStats[parentDir]
			stats.size += size
			stats.count++
			dirStats[parentDir] = stats
		}
	}
}

// calculateDirLogSize 计算指定目录下的日志文件大小
func (s *CleanService) calculateDirLogSize(dirPath string) (int64, int, error) {
	var size int64
	var count int

	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		// 只统计当前目录，不递归子目录
		if info.IsDir() && path != dirPath {
			return filepath.SkipDir
		}

		// 只处理 .log 文件
		if !info.IsDir() && filepath.Ext(path) == ".log" {
			size += info.Size()
			count++
		}

		return nil
	})

	return size, count, err
}

// CleanLogFiles 清理常见日志目录中的 .log 文件（优化版本）
func (s *CleanService) CleanLogFiles() (int64, int, error) {
	var cleanedSize int64
	var cleanedCount int

	// 定义常见的日志文件目录（与扫描逻辑一致）
	userProfile := os.Getenv("USERPROFILE")
	localAppData := os.Getenv("LOCALAPPDATA")
	appData := os.Getenv("APPDATA")
	programData := os.Getenv("PROGRAMDATA")

	type cleanConfig struct {
		path     string
		maxDepth int
	}

	cleanConfigs := []cleanConfig{
		{filepath.Join(localAppData), 5},
		{filepath.Join(appData), 5},
		{programData, 5},
		{filepath.Join(localAppData, "Temp"), 4},
		{filepath.Join(userProfile, "AppData", "Local", "Temp"), 4},
		{"C:\\Temp", 4},
		{"C:\\tmp", 4},
		{filepath.Join(userProfile, "Desktop"), 2},
		{filepath.Join(userProfile, "Documents"), 2},
		{filepath.Join(userProfile, "Downloads"), 2},
		{"C:\\Program Files", 4},
		{"C:\\Program Files (x86)", 4},
		{filepath.Join(userProfile, ".config"), 3},
		{filepath.Join(userProfile, ".cache"), 3},
		{filepath.Join(userProfile, ".local"), 3},
	}

	// 清理每个目录
	for _, config := range cleanConfigs {
		if _, err := os.Stat(config.path); os.IsNotExist(err) {
			continue
		}

		s.cleanLogFilesInDir(config.path, 0, config.maxDepth, &cleanedSize, &cleanedCount)
	}

	return cleanedSize, cleanedCount, nil
}

// cleanLogFilesInDir 递归清理目录中的日志文件（带深度限制）
func (s *CleanService) cleanLogFilesInDir(dir string, currentDepth, maxDepth int, cleanedSize *int64, cleanedCount *int) {
	if currentDepth > maxDepth {
		return
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return
	}

	for _, entry := range entries {
		fullPath := filepath.Join(dir, entry.Name())

		if entry.IsDir() {
			name := entry.Name()
			if name == "node_modules" || name == ".git" || name == "$Recycle.Bin" ||
				name == "System Volume Information" {
				continue
			}

			s.cleanLogFilesInDir(fullPath, currentDepth+1, maxDepth, cleanedSize, cleanedCount)
		} else if filepath.Ext(entry.Name()) == ".log" {
			info, err := entry.Info()
			if err != nil {
				continue
			}

			size := info.Size()
			if err := os.Remove(fullPath); err == nil {
				*cleanedSize += size
				*cleanedCount++
			}
		}
	}
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
		{ID: "6", Name: "应用缓存", Checked: false, Safe: false, Status: "idle"},
		{ID: "7", Name: "应用日志文件", Checked: false, Safe: false, Status: "idle"},
	}

	// 使用 goroutine 并行扫描
	var wg sync.WaitGroup
	for i := range items {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			s.ScanSingleItem(items[index])
		}(i)
	}
	wg.Wait()

	return items, nil
}

// ScanSingleItem 扫描单个清理项（导出方法）
func (s *CleanService) ScanSingleItem(item *models.CleanItem) {
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
		paths := s.GetWindowsUpdateCachePaths()
		s.scanPaths(item, paths)

	case "5": // 系统文件清理
		paths := s.GetSystemFilePaths()
		s.scanPaths(item, paths)

	case "6": // 应用缓存
		paths := s.GetAppCachePaths()
		s.scanPaths(item, paths)

	case "7": // 应用日志文件
		size, fileCount, logPaths, err := s.ScanLogFiles()
		if err == nil {
			item.Size = size
			item.FileCount = fileCount

			// 添加路径详情（显示包含日志文件的目录）
			var pathDetails []models.PathDetail
			for _, path := range logPaths {
				// 计算该目录下的日志文件大小
				dirSize, dirCount, _ := s.calculateDirLogSize(path)
				if dirSize > 0 {
					pathDetails = append(pathDetails, models.PathDetail{
						Path:      path,
						Size:      dirSize,
						FileCount: dirCount,
					})
				}
			}

			// 按大小从大到小排序
			sort.Slice(pathDetails, func(i, j int) bool {
				return pathDetails[i].Size > pathDetails[j].Size
			})

			item.Paths = pathDetails
		}
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
		0x00000001|0x00000002, // SHERB_NOCONFIRMATION | SHERB_NOPROGRESSUI
	)

	// HRESULT 返回值：
	// S_OK (0x00000000) = 成功清空
	// S_FALSE (0x00000001) = 回收站已经是空的
	if ret == 0 || ret == 1 {
		return nil
	}

	// 解析常见错误
	var errMsg string
	switch ret {
	case 0x80070005: // E_ACCESSDENIED
		errMsg = "权限不足，请以管理员身份运行"
	case 0x8000FFFF: // E_UNEXPECTED
		errMsg = "回收站被占用或系统状态异常，请关闭资源管理器中的回收站窗口后重试"
	case 0x80004005: // E_FAIL
		errMsg = "操作失败"
	default:
		errMsg = fmt.Sprintf("未知错误 (HRESULT: 0x%X)", ret)
	}

	return fmt.Errorf("%s", errMsg)
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

// ScanDesktop 扫描桌面文件
func (s *CleanService) ScanDesktop(desktopPath string) ([]*models.DesktopFileInfo, error) {
	// 如果没有提供路径，使用默认桌面路径
	if desktopPath == "" {
		userProfile := os.Getenv("USERPROFILE")
		if userProfile == "" {
			return nil, fmt.Errorf("无法获取用户配置文件路径")
		}
		desktopPath = filepath.Join(userProfile, "Desktop")

		// 检查路径是否存在，如果不存在尝试其他可能的位置
		if _, err := os.Stat(desktopPath); os.IsNotExist(err) {
			// 尝试公共桌面路径
			publicProfile := os.Getenv("PUBLIC")
			if publicProfile != "" {
				publicDesktop := filepath.Join(publicProfile, "Desktop")
				if _, err := os.Stat(publicDesktop); err == nil {
					desktopPath = publicDesktop
				}
			}

			// 如果仍然不存在，尝试获取当前用户的真实桌面路径
			if _, err := os.Stat(desktopPath); os.IsNotExist(err) {
				// 使用 Windows API 获取桌面路径（简化实现）
				desktopPath = s.getDesktopPath()
			}
		}
	}

	// 检查路径是否存在
	if _, err := os.Stat(desktopPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("桌面路径不存在: %s", desktopPath)
	}

	// 读取桌面目录内容
	entries, err := os.ReadDir(desktopPath)
	if err != nil {
		return nil, fmt.Errorf("无法读取桌面目录: %v", err)
	}

	var files []*models.DesktopFileInfo
	id := 1

	for _, entry := range entries {
		fullPath := filepath.Join(desktopPath, entry.Name())

		// 获取文件信息
		info, err := entry.Info()
		if err != nil {
			continue // 跳过无法获取信息的文件
		}

		// 判断文件类型
		fileType := "file"
		if info.IsDir() {
			fileType = "folder"
		} else if strings.HasSuffix(strings.ToLower(entry.Name()), ".lnk") {
			fileType = "shortcut"
		}

		desktopFile := &models.DesktopFileInfo{
			ID:           fmt.Sprintf("%d", id),
			Name:         entry.Name(),
			Path:         fullPath,
			Type:         fileType,
			Size:         info.Size(),
			ModifiedTime: info.ModTime().Format("2006-01-02 15:04:05"),
		}

		files = append(files, desktopFile)
		id++
	}

	return files, nil
}

// getDesktopPath 获取当前用户的桌面路径
func (s *CleanService) getDesktopPath() string {
	userProfile := os.Getenv("USERPROFILE")
	if userProfile != "" {
		desktopPath := filepath.Join(userProfile, "Desktop")
		return desktopPath
	}
	// 兜底方案
	return "C:\\Users\\Default\\Desktop"
}

// DeleteDesktopFile 删除桌面文件
func (s *CleanService) DeleteDesktopFile(filePath string) error {
	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return fmt.Errorf("文件不存在: %s", filePath)
	}

	// 删除文件或文件夹
	err := os.RemoveAll(filePath)
	if err != nil {
		return fmt.Errorf("删除失败: %v", err)
	}

	return nil
}

// SelectFolder 使用系统对话框选择文件夹
func (s *CleanService) SelectFolder() (string, error) {
	// 这里使用简单的实现，实际项目中可能需要使用 Windows API 或第三方库
	// 返回当前用户的桌面路径
	return s.getDesktopPath(), nil
}
