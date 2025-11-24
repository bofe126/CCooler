package main

import (
	"ccooler/backend/models"
	"ccooler/backend/services"
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"syscall"
	"time"
	"unsafe"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/sys/windows"
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

	// HTTP服务器用于接收辅助程序结果和进度
	httpServer       *http.Server
	httpPort         string
	elevatedResults  map[string]chan *ElevatedResult
	elevatedProgress map[string]chan *ElevatedProgress
	resultsMutex     sync.Mutex
}

// ElevatedResult 提升权限执行结果
type ElevatedResult struct {
	Success      bool   `json:"success"`
	Error        string `json:"error,omitempty"`
	CleanedSize  int64  `json:"cleanedSize"`
	CleanedCount int    `json:"cleanedCount"`
}

// ElevatedProgress 提升权限执行进度
type ElevatedProgress struct {
	ProcessedPaths int    `json:"processedPaths"`
	TotalPaths     int    `json:"totalPaths"`
	CleanedSize    int64  `json:"cleanedSize"`
	CleanedCount   int    `json:"cleanedCount"`
	CurrentPath    string `json:"currentPath"`
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
	a.elevatedResults = make(map[string]chan *ElevatedResult)
	a.elevatedProgress = make(map[string]chan *ElevatedProgress)

	// 启动HTTP服务器接收辅助程序结果和进度
	a.startHTTPServer()
}

func (a *App) startHTTPServer() error {
	// 监听随机端口
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return err
	}

	a.httpPort = fmt.Sprintf("%d", listener.Addr().(*net.TCPAddr).Port)

	mux := http.NewServeMux()
	mux.HandleFunc("/elevated-result", a.handleElevatedResult)
	mux.HandleFunc("/elevated-progress", a.handleElevatedProgress)

	a.httpServer = &http.Server{Handler: mux}

	go func() {
		a.httpServer.Serve(listener)
	}()

	return nil
}

func (a *App) handleElevatedResult(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var result ElevatedResult
	if err := json.NewDecoder(r.Body).Decode(&result); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 发送结果到等待的通道
	a.resultsMutex.Lock()
	for _, ch := range a.elevatedResults {
		select {
		case ch <- &result:
			// 发送成功
		default:
			// 通道已满，跳过
		}
	}
	a.resultsMutex.Unlock()

	w.WriteHeader(http.StatusOK)
}

func (a *App) handleElevatedProgress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var progress ElevatedProgress
	if err := json.NewDecoder(r.Body).Decode(&progress); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 发送进度到等待的通道
	a.resultsMutex.Lock()
	for _, ch := range a.elevatedProgress {
		select {
		case ch <- &progress:
			// 发送成功
		default:
			// 通道已满，跳过
		}
	}
	a.resultsMutex.Unlock()

	w.WriteHeader(http.StatusOK)
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

// CleanItems 清理选中的项目（统一使用扫描结果中的路径）
func (a *App) CleanItems(items []*models.CleanItem) error {
	fmt.Printf("[DEBUG] CleanItems called with %d items\n", len(items))

	for _, item := range items {
		fmt.Printf("[DEBUG] Processing item: id=%s, name=%s, checked=%v\n", item.ID, item.Name, item.Checked)

		if !item.Checked {
			fmt.Printf("[DEBUG] Item %s not checked, skipping\n", item.ID)
			continue
		}

		// 跳过需要管理员权限的项目（应该通过CleanItemElevated处理）
		if item.ID == "4" || item.ID == "5" {
			fmt.Printf("[DEBUG] Item %s needs admin, skipping\n", item.ID)
			continue
		}

		fmt.Printf("[DEBUG] Cleaning item %s: %s\n", item.ID, item.Name)

		// 特殊处理：回收站和日志文件
		if item.ID == "3" {
			// 回收站使用特殊API
			fmt.Printf("[DEBUG] Emptying recycle bin...\n")
			err := a.cleanService.EmptyRecycleBin()
			if err != nil {
				fmt.Printf("[DEBUG] Recycle bin empty failed: %v\n", err)
				item.Status = "error"
				item.Error = "清空回收站失败: " + err.Error()
				continue
			}
			fmt.Printf("[DEBUG] Recycle bin emptied successfully\n")
			item.Status = "completed"
			continue
		}

		if item.ID == "7" {
			// 日志文件：使用扫描结果中的路径
			fmt.Printf("[DEBUG] Using %d log paths from scan results\n", len(item.Paths))
			var totalCleaned int64
			var totalCount int
			for i, pathDetail := range item.Paths {
				fmt.Printf("[DEBUG] Cleaning log path [%d/%d]: %s\n", i+1, len(item.Paths), pathDetail.Path)
				cleaned, count := a.cleanLogFilesInPath(pathDetail.Path)
				totalCleaned += cleaned
				totalCount += count
				fmt.Printf("[DEBUG] Cleaned %s: %d bytes, %d files\n", pathDetail.Path, cleaned, count)
			}
			item.Size = totalCleaned
			item.FileCount = totalCount
			item.Status = "completed"
			fmt.Printf("[DEBUG] Log files cleaned: %d bytes, %d files total\n", totalCleaned, totalCount)
			continue
		}

		// 统一处理：使用扫描结果中的路径
		fmt.Printf("[DEBUG] Using %d paths from scan results\n", len(item.Paths))
		var paths []string
		for _, pathDetail := range item.Paths {
			paths = append(paths, pathDetail.Path)
		}

		if len(paths) == 0 {
			fmt.Printf("[DEBUG] No paths to clean for item %s\n", item.ID)
			item.Status = "completed"
			continue
		}

		// 清理所有路径
		var totalCleaned int64
		hasError := false
		for i, path := range paths {
			fmt.Printf("[DEBUG] Cleaning path [%d/%d]: %s\n", i+1, len(paths), path)
			cleaned, err := a.cleanService.CleanFolderSafe(path)
			if err != nil {
				fmt.Printf("[DEBUG] Failed to clean %s: %v\n", path, err)
				hasError = true
			} else {
				fmt.Printf("[DEBUG] Cleaned %s: %d bytes\n", path, cleaned)
				totalCleaned += cleaned
			}
		}

		if hasError {
			item.Status = "error"
			item.Error = "部分路径清理失败（文件可能正在使用）"
		} else {
			item.Status = "completed"
		}

		fmt.Printf("[DEBUG] Item %s cleaned: %d bytes total\n", item.ID, totalCleaned)
	}

	fmt.Printf("[DEBUG] CleanItems completed\n")
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

// ScanDesktop 扫描桌面文件
func (a *App) ScanDesktop(desktopPath string) ([]*models.DesktopFileInfo, error) {
	return a.cleanService.ScanDesktop(desktopPath)
}

// DeleteDesktopFile 删除桌面文件
func (a *App) DeleteDesktopFile(filePath string) error {
	return a.cleanService.DeleteDesktopFile(filePath)
}

// SelectFolder 选择文件夹
func (a *App) SelectFolder() (string, error) {
	return a.cleanService.SelectFolder()
}

// CleanItemElevated 以管理员权限清理项目
func (a *App) CleanItemElevated(item *models.CleanItem) (*ElevatedResult, error) {
	itemID := item.ID

	// itemID=3 (回收站) 使用特殊API
	if itemID == "3" {
		fmt.Printf("[DEBUG] Emptying recycle bin...\n")
		err := a.cleanService.EmptyRecycleBin()
		if err != nil {
			return &ElevatedResult{
				Success: false,
				Error:   err.Error(),
			}, nil
		}
		return &ElevatedResult{
			Success: true,
		}, nil
	}

	// itemID=7 (应用日志文件) 使用特殊处理，不通过辅助程序
	if itemID == "7" {
		// 使用扫描结果中的路径
		fmt.Printf("[DEBUG] Using %d log paths from scan results\n", len(item.Paths))
		var totalCleaned int64
		var totalCount int
		for _, pathDetail := range item.Paths {
			cleaned, count := a.cleanLogFilesInPath(pathDetail.Path)
			totalCleaned += cleaned
			totalCount += count
		}
		return &ElevatedResult{
			Success:      true,
			CleanedSize:  totalCleaned,
			CleanedCount: totalCount,
		}, nil
	}

	// 1. 检查是否已经提升了权限
	isAdmin := a.IsAdmin()
	isElevated := a.IsElevated()
	fmt.Printf("[DEBUG] CleanItemElevated: itemID=%s, isAdmin=%v, isElevated=%v\n", itemID, isAdmin, isElevated)

	if isElevated {
		// 已经提升了权限，直接执行（不会弹UAC）
		fmt.Println("[DEBUG] Already elevated, executing directly")
		return a.cleanItemDirect(item)
	}

	// 2. 获取要清理的路径列表
	fmt.Printf("[DEBUG] Using %d paths from scan results\n", len(item.Paths))
	var paths []string
	for _, pathDetail := range item.Paths {
		paths = append(paths, pathDetail.Path)
	}

	if len(paths) == 0 {
		return &ElevatedResult{
			Success: false,
			Error:   "没有找到要清理的路径",
		}, nil
	}

	// 3. 获取辅助程序路径
	exePath, err := os.Executable()
	if err != nil {
		return &ElevatedResult{
			Success: false,
			Error:   fmt.Sprintf("无法获取程序路径: %v", err),
		}, nil
	}

	exeDir := filepath.Dir(exePath)
	runtime.LogDebugf(a.ctx, "Executable dir: %s", exeDir)

	// 辅助程序必须与主程序在同一目录
	helperPath := filepath.Join(exeDir, "CCoolerElevated.exe")
	absHelperPath, _ := filepath.Abs(helperPath)

	runtime.LogDebugf(a.ctx, "Looking for helper: %s", absHelperPath)

	if _, err := os.Stat(helperPath); err != nil {
		errMsg := fmt.Sprintf("辅助程序 CCoolerElevated.exe 不存在\n\n期望位置: %s\n当前程序目录: %s\n\n请确保 CCoolerElevated.exe 与 CCooler.exe 在同一目录下", absHelperPath, exeDir)
		runtime.LogError(a.ctx, errMsg)
		return &ElevatedResult{
			Success: false,
			Error:   "辅助程序 CCoolerElevated.exe 不存在，请确保它与主程序在同一目录",
		}, nil
	}

	runtime.LogInfof(a.ctx, "✓ Found helper at: %s", absHelperPath)

	// 4. 创建结果和进度通道
	resultChan := make(chan *ElevatedResult, 1)
	progressChan := make(chan *ElevatedProgress, 10)
	resultID := fmt.Sprintf("clean-%s-%d", itemID, time.Now().Unix())

	a.resultsMutex.Lock()
	a.elevatedResults[resultID] = resultChan
	a.elevatedProgress[resultID] = progressChan
	a.resultsMutex.Unlock()

	defer func() {
		a.resultsMutex.Lock()
		delete(a.elevatedResults, resultID)
		delete(a.elevatedProgress, resultID)
		a.resultsMutex.Unlock()
	}()

	// 5. 构造命令行参数（使用|分隔路径）
	pathsStr := ""
	for i, path := range paths {
		if i > 0 {
			pathsStr += "|"
		}
		pathsStr += path
	}
	args := fmt.Sprintf("-task=clean-item-%s -port=%s -paths=\"%s\"", itemID, a.httpPort, pathsStr)

	// 6. 使用ShellExecute启动提升的辅助程序
	helperLogPath := filepath.Join(filepath.Dir(helperPath), "CCoolerElevated.log")
	runtime.LogInfof(a.ctx, "辅助程序日志: %s", helperLogPath)
	runtime.LogDebugf(a.ctx, "Launching: %s", helperPath)
	runtime.LogDebugf(a.ctx, "Args: %s", args)

	err = a.shellExecuteElevated(helperPath, args)
	if err != nil {
		runtime.LogErrorf(a.ctx, "ShellExecute failed: %v", err)
		return &ElevatedResult{
			Success: false,
			Error:   fmt.Sprintf("启动辅助程序失败: %v", err),
		}, nil
	}

	runtime.LogInfo(a.ctx, "ShellExecute succeeded, waiting for result...")
	runtime.LogInfo(a.ctx, "如果看到UAC窗口，请点击\"是\"以继续")

	// 7. 等待结果（动态超时：收到进度就重置超时）
	timeout := time.NewTimer(30 * time.Second)
	defer timeout.Stop()

	for {
		select {
		case result := <-resultChan:
			runtime.LogInfo(a.ctx, "收到清理结果")
			return result, nil

		case progress := <-progressChan:
			// 收到进度，重置超时
			timeout.Reset(30 * time.Second)
			runtime.LogDebugf(a.ctx, "进度: %d/%d, 已清理: %d MB",
				progress.ProcessedPaths, progress.TotalPaths, progress.CleanedSize/1024/1024)

			// 通知前端更新进度
			runtime.EventsEmit(a.ctx, "clean-progress", progress)

		case <-timeout.C:
			runtime.LogError(a.ctx, "清理超时！可能原因：")
			runtime.LogError(a.ctx, "1. UAC 窗口被取消（点击了\"否\"）")
			runtime.LogError(a.ctx, "2. UAC 窗口在后台等待确认（请检查任务栏）")
			runtime.LogError(a.ctx, "3. 辅助程序启动失败")
			return &ElevatedResult{
				Success: false,
				Error:   "清理超时（30秒无响应）。请确认是否在UAC窗口中点击了\"是\"",
			}, nil
		}
	}
}

func (a *App) shellExecuteElevated(exePath, args string) error {
	verb, _ := syscall.UTF16PtrFromString("runas")
	exe, _ := syscall.UTF16PtrFromString(exePath)
	params, _ := syscall.UTF16PtrFromString(args)

	var showCmd int32 = windows.SW_HIDE // 隐藏窗口

	// ShellExecute 返回值 > 32 表示成功，<= 32 表示错误
	ret, _, _ := syscall.NewLazyDLL("shell32.dll").NewProc("ShellExecuteW").Call(
		0, // hwnd
		uintptr(unsafe.Pointer(verb)),
		uintptr(unsafe.Pointer(exe)),
		uintptr(unsafe.Pointer(params)),
		0, // dir
		uintptr(showCmd),
	)

	fmt.Printf("[DEBUG] ShellExecute return value: %d\n", ret)
	runtime.LogDebugf(a.ctx, "ShellExecute return value: %d", ret)

	if ret <= 32 {
		// 返回值 <= 32 表示错误
		// 常见错误码：
		// 0 = 内存不足
		// 2 = 文件未找到
		// 3 = 路径未找到
		// 5 = 访问被拒绝
		// 8 = 内存不足
		// 26 = 共享冲突
		// 27 = 文件关联不完整
		// 28 = DDE 超时
		// 29 = DDE 失败
		// 30 = DDE 忙
		// 31 = 没有关联
		// 32 = DLL 未找到
		return fmt.Errorf("ShellExecute failed with code %d", ret)
	}

	return nil
}

// cleanLogFilesInPath 清理指定路径下的所有 .log 文件
func (a *App) cleanLogFilesInPath(dirPath string) (int64, int) {
	var cleanedSize int64
	var cleanedCount int

	filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // 跳过无权限的文件
		}

		if !info.IsDir() && filepath.Ext(path) == ".log" {
			size := info.Size()
			if err := os.Remove(path); err == nil {
				cleanedSize += size
				cleanedCount++
			}
		}
		return nil
	})

	return cleanedSize, cleanedCount
}

// cleanItemDirect 直接清理（已有管理员权限）
func (a *App) cleanItemDirect(item *models.CleanItem) (*ElevatedResult, error) {
	result := &ElevatedResult{Success: true}
	itemID := item.ID

	// 使用扫描结果中的路径
	fmt.Printf("[DEBUG] cleanItemDirect: Using %d paths from scan results\n", len(item.Paths))
	var paths []string
	for _, pathDetail := range item.Paths {
		paths = append(paths, pathDetail.Path)
	}

	if len(paths) == 0 {
		return &ElevatedResult{
			Success: false,
			Error:   fmt.Sprintf("没有找到要清理的路径 (itemID: %s)", itemID),
		}, nil
	}

	// 清理所有路径
	for _, path := range paths {
		size, count := a.cleanFolderAndCount(path)
		result.CleanedSize += size
		result.CleanedCount += count
	}

	return result, nil
}

// getCleanPaths 获取清理路径列表（统一从CleanService获取，避免硬编码）
func (a *App) getCleanPaths(itemID string) []string {
	switch itemID {
	case "1": // 系统临时文件
		return []string{
			a.cleanService.GetTempPath(),
			a.cleanService.GetSystemTempPath(),
		}
	case "2": // 浏览器缓存
		return a.cleanService.GetBrowserCachePaths()
	case "3": // 回收站
		return []string{a.cleanService.GetRecycleBinPath()}
	case "4": // Windows更新缓存
		return a.cleanService.GetWindowsUpdateCachePaths()
	case "5": // 系统文件清理
		return a.cleanService.GetSystemFilePaths()
	case "6": // 应用缓存
		return a.cleanService.GetAppCachePaths()
	case "7": // 应用日志文件
		// 日志文件通过 CleanLogFiles 特殊处理，不使用路径清理
		return []string{}
	default:
		return []string{}
	}
}

// cleanFolderAndCount 清理文件夹并统计
func (a *App) cleanFolderAndCount(path string) (int64, int) {
	var totalSize int64
	var count int

	filepath.Walk(path, func(filePath string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		if !info.IsDir() {
			totalSize += info.Size()
			count++
			os.Remove(filePath)
		}
		return nil
	})

	return totalSize, count
}
