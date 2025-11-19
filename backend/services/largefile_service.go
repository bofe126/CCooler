package services

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

// LargeFileCategory 大文件分类
type LargeFileCategory string

const (
	CategoryAll       LargeFileCategory = "all"
	CategoryDownload  LargeFileCategory = "download"
	CategoryMedia     LargeFileCategory = "media"
	CategoryDocument  LargeFileCategory = "document"
	CategoryArchive   LargeFileCategory = "archive"
	CategoryInstaller LargeFileCategory = "installer"
	CategoryOther     LargeFileCategory = "other"
)

// LargeFileInfo 大文件信息
type LargeFileInfo struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Path         string            `json:"path"`
	Size         int64             `json:"size"`
	Category     LargeFileCategory `json:"category"`
	ModifiedTime string            `json:"modifiedTime"`
	Extension    string            `json:"extension"`
}

// CategoryStats 分类统计
type CategoryStats struct {
	Category  LargeFileCategory `json:"category"`
	TotalSize int64             `json:"totalSize"`
	FileCount int               `json:"fileCount"`
}

// ScanResult 扫描结果
type ScanResult struct {
	Files      []LargeFileInfo `json:"files"`
	Stats      []CategoryStats `json:"stats"`
	TotalFiles int             `json:"totalFiles"`
	TotalSize  int64           `json:"totalSize"`
}

// LargeFileService 大文件扫描服务
type LargeFileService struct {
	minSize int64 // 最小文件大小（字节）
}

// NewLargeFileService 创建大文件扫描服务
func NewLargeFileService() *LargeFileService {
	return &LargeFileService{
		minSize: 100 * 1024 * 1024, // 默认100MB
	}
}

// SetMinSize 设置最小文件大小
func (s *LargeFileService) SetMinSize(sizeInMB int64) {
	s.minSize = sizeInMB * 1024 * 1024
}

// ScanCDrive 扫描C盘大文件
func (s *LargeFileService) ScanCDrive() (*ScanResult, error) {
	files := make([]LargeFileInfo, 0)
	fileID := 0

	// 遍历C盘
	err := filepath.WalkDir("C:\\", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			// 忽略无权限访问的目录
			return nil
		}

		// 跳过目录
		if d.IsDir() {
			// 跳过系统目录和隐藏目录
			if shouldSkipDir(path) {
				return filepath.SkipDir
			}
			return nil
		}

		// 获取文件信息
		info, err := d.Info()
		if err != nil {
			return nil
		}

		// 先判断文件分类
		category := s.categorizeFile(path)

		// 根据分类设置不同的最小大小阈值
		minSizeForCategory := s.getMinSizeForCategory(category)

		// 只处理大于最小大小的文件
		if info.Size() >= minSizeForCategory {
			fileID++

			files = append(files, LargeFileInfo{
				ID:           fmt.Sprintf("%d", fileID),
				Name:         info.Name(),
				Path:         path,
				Size:         info.Size(),
				Category:     category,
				ModifiedTime: info.ModTime().Format("2006-01-02 15:04"),
				Extension:    strings.ToLower(filepath.Ext(path)),
			})
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// 计算统计信息
	stats := s.calculateStats(files)

	return &ScanResult{
		Files:      files,
		Stats:      stats,
		TotalFiles: len(files),
		TotalSize:  s.calculateTotalSize(files),
	}, nil
}

// shouldSkipDir 判断是否跳过目录
func shouldSkipDir(path string) bool {
	lowerPath := strings.ToLower(path)

	// 跳过系统目录
	skipDirs := []string{
		"c:\\windows\\",
		"c:\\$recycle.bin\\",
		"c:\\system volume information\\",
		"c:\\pagefile.sys",
		"c:\\hiberfil.sys",
		"c:\\swapfile.sys",
		"c:\\programdata\\microsoft\\windows\\wer\\",
	}

	for _, skipDir := range skipDirs {
		if strings.HasPrefix(lowerPath, skipDir) {
			return true
		}
	}

	return false
}

// getMinSizeForCategory 根据文件分类返回最小大小阈值
func (s *LargeFileService) getMinSizeForCategory(category LargeFileCategory) int64 {
	// 所有分类统一：10MB起
	return 10 * 1024 * 1024 // 10MB
}

// 文件扩展名分类映射（使用 map 提升查找性能）
var (
	videoExtensions = map[string]bool{
		// 常见视频格式
		".mp4":  true, // MPEG-4
		".avi":  true, // Audio Video Interleave
		".mkv":  true, // Matroska Video
		".mov":  true, // QuickTime
		".wmv":  true, // Windows Media Video
		".flv":  true, // Flash Video
		".webm": true, // WebM
		".m4v":  true, // iTunes Video
		".mpg":  true, // MPEG
		".mpeg": true, // MPEG

		// 高清和专业格式
		".ts":   true, // MPEG Transport Stream（直播录制）
		".mts":  true, // AVCHD（高清摄像机）
		".m2ts": true, // Blu-ray BDAV
		".vob":  true, // DVD Video Object

		// 其他常见格式
		".rm":   true, // RealMedia
		".rmvb": true, // RealMedia Variable Bitrate
		".3gp":  true, // 3GPP（手机视频）
		".3g2":  true, // 3GPP2
		".f4v":  true, // Flash MP4
		".asf":  true, // Advanced Systems Format
		".divx": true, // DivX
		".xvid": true, // Xvid
		".ogv":  true, // Ogg Video
	}

	imageExtensions = map[string]bool{
		// 常见图片格式
		".jpg":  true, // JPEG
		".jpeg": true, // JPEG
		".png":  true, // PNG
		".gif":  true, // GIF
		".bmp":  true, // Bitmap
		".webp": true, // WebP
		".svg":  true, // SVG
		".ico":  true, // Icon

		// RAW 格式（相机原始文件）
		".raw": true, // Generic RAW
		".cr2": true, // Canon RAW
		".nef": true, // Nikon RAW
		".arw": true, // Sony RAW
		".dng": true, // Adobe Digital Negative
		".orf": true, // Olympus RAW
		".rw2": true, // Panasonic RAW
		".pef": true, // Pentax RAW
		".sr2": true, // Sony RAW

		// 专业图片格式
		".tif":  true, // TIFF
		".tiff": true, // TIFF
		".heic": true, // HEIF（iPhone）
		".heif": true, // HEIF
		".avif": true, // AV1 Image

		// 设计格式（大图片文件）
		".psd": true, // Photoshop（也在文档中，优先归为图片）
		".ai":  true, // Illustrator（也在文档中，优先归为图片）
	}

	audioExtensions = map[string]bool{
		// 无损音频
		".flac": true, // FLAC
		".ape":  true, // APE
		".wav":  true, // WAV
		".aiff": true, // AIFF
		".alac": true, // Apple Lossless
		".dsd":  true, // DSD
		".dsf":  true, // DSF

		// 有损音频
		".mp3":  true, // MP3
		".aac":  true, // AAC
		".m4a":  true, // M4A
		".ogg":  true, // Ogg Vorbis
		".opus": true, // Opus
		".wma":  true, // Windows Media Audio

		// 其他音频格式
		".mid":  true, // MIDI
		".midi": true, // MIDI
		".ra":   true, // RealAudio
		".ac3":  true, // AC3
		".dts":  true, // DTS
	}

	archiveExtensions = map[string]bool{
		// 常见压缩格式
		".zip": true, // ZIP
		".rar": true, // RAR
		".7z":  true, // 7-Zip
		".tar": true, // TAR
		".gz":  true, // GZip
		".bz2": true, // BZip2
		".xz":  true, // XZ

		// 组合压缩格式
		".tar.gz":  true, // TAR + GZip
		".tar.bz2": true, // TAR + BZip2
		".tar.xz":  true, // TAR + XZ
		".tgz":     true, // TAR + GZip
		".tbz":     true, // TAR + BZip2
		".tbz2":    true, // TAR + BZip2

		// 其他压缩格式
		".iso":  true, // ISO镜像
		".img":  true, // 磁盘镜像
		".dmg":  true, // macOS磁盘镜像
		".arj":  true, // ARJ
		".lzh":  true, // LZH
		".ace":  true, // ACE
		".z":    true, // Compress
		".zipx": true, // WinZip Extended
	}

	installerExtensions = map[string]bool{
		// Windows 安装包
		".exe":        true, // 可执行文件/安装程序
		".msi":        true, // Windows Installer
		".msix":       true, // Windows 10+ 应用包
		".appx":       true, // Windows 应用包
		".appxbundle": true, // Windows 应用包集合

		// macOS 安装包
		".dmg": true, // macOS 磁盘镜像
		".pkg": true, // macOS 安装包
		".app": true, // macOS 应用程序

		// Linux 安装包
		".deb":      true, // Debian/Ubuntu
		".rpm":      true, // RedHat/CentOS/Fedora
		".snap":     true, // Snap 包
		".flatpak":  true, // Flatpak 包
		".appimage": true, // AppImage

		// 跨平台
		".jar": true, // Java 应用
		".apk": true, // Android 应用

		// 其他
		".cab": true, // Windows Cabinet 文件
		".msp": true, // Windows Installer Patch
		".msu": true, // Windows Update 包
	}

	documentExtensions = map[string]bool{
		// Microsoft Office
		".doc":  true, // Word 97-2003
		".docx": true, // Word 2007+
		".xls":  true, // Excel 97-2003
		".xlsx": true, // Excel 2007+
		".ppt":  true, // PowerPoint 97-2003
		".pptx": true, // PowerPoint 2007+
		".xlsm": true, // Excel 宏文件
		".xlsb": true, // Excel 二进制文件
		".pptm": true, // PowerPoint 宏文件
		".docm": true, // Word 宏文件

		// WPS Office（国内常用）
		".wps": true, // WPS文字
		".et":  true, // WPS表格
		".dps": true, // WPS演示

		// Apple iWork
		".pages":   true, // Pages
		".numbers": true, // Numbers
		".key":     true, // Keynote

		// OpenDocument Format
		".odt": true, // Text
		".ods": true, // Spreadsheet
		".odp": true, // Presentation
		".odg": true, // Graphics
		".odf": true, // Formula

		// PDF 和电子书
		".pdf":  true, // Portable Document Format
		".xps":  true, // XML Paper Specification
		".epub": true, // 电子书
		".mobi": true, // Kindle
		".azw":  true, // Kindle
		".azw3": true, // Kindle
		".djvu": true, // DjVu文档
		".chm":  true, // Windows帮助文档
	}
)

// categorizeFile 文件分类
func (s *LargeFileService) categorizeFile(path string) LargeFileCategory {
	ext := strings.ToLower(filepath.Ext(path))

	// 优先按文件类型分类（更精确）
	// 影音文件（视频、音频、图片）
	if videoExtensions[ext] || audioExtensions[ext] || imageExtensions[ext] {
		return CategoryMedia
	}

	// 压缩包
	if archiveExtensions[ext] {
		return CategoryArchive
	}

	// 安装包
	if installerExtensions[ext] {
		return CategoryInstaller
	}

	// 办公文档
	if documentExtensions[ext] {
		return CategoryDocument
	}

	// 其他（下载目录的文件会在统计时单独处理）
	return CategoryOther
}

// calculateStats 计算分类统计
func (s *LargeFileService) calculateStats(files []LargeFileInfo) []CategoryStats {
	statsMap := make(map[LargeFileCategory]*CategoryStats)

	// 初始化统计
	categories := []LargeFileCategory{CategoryAll, CategoryDownload, CategoryMedia, CategoryDocument, CategoryArchive, CategoryInstaller, CategoryOther}
	for _, cat := range categories {
		statsMap[cat] = &CategoryStats{
			Category:  cat,
			TotalSize: 0,
			FileCount: 0,
		}
	}

	// 计算统计
	for _, file := range files {
		// 更新全部分类
		statsMap[CategoryAll].TotalSize += file.Size
		statsMap[CategoryAll].FileCount++

		// 更新具体分类（按文件类型）
		if stat, ok := statsMap[file.Category]; ok {
			stat.TotalSize += file.Size
			stat.FileCount++
		}

		// 如果文件在Downloads目录，同时统计到下载分类
		lowerPath := strings.ToLower(file.Path)
		if strings.Contains(lowerPath, "\\downloads\\") {
			statsMap[CategoryDownload].TotalSize += file.Size
			statsMap[CategoryDownload].FileCount++
		}
	}

	// 转换为数组
	stats := make([]CategoryStats, 0, len(categories))
	for _, cat := range categories {
		stats = append(stats, *statsMap[cat])
	}

	return stats
}

// calculateTotalSize 计算总大小
func (s *LargeFileService) calculateTotalSize(files []LargeFileInfo) int64 {
	var total int64
	for _, file := range files {
		total += file.Size
	}
	return total
}

// DeleteFile 删除文件
func (s *LargeFileService) DeleteFile(path string) error {
	// 检查文件是否存在
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return fmt.Errorf("文件不存在: %s", path)
	}

	// 删除文件
	err := os.Remove(path)
	if err != nil {
		return fmt.Errorf("删除文件失败: %v", err)
	}

	return nil
}

// OpenFileLocation 在资源管理器中打开文件位置
func (s *LargeFileService) OpenFileLocation(path string) error {
	// 检查文件是否存在
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return fmt.Errorf("文件不存在: %s", path)
	}

	// 使用 Windows API 打开文件位置并选中文件
	// 使用 explorer /select 命令
	shell32 := syscall.NewLazyDLL("shell32.dll")
	shellExecute := shell32.NewProc("ShellExecuteW")

	operation, _ := syscall.UTF16PtrFromString("open")
	file, _ := syscall.UTF16PtrFromString("explorer.exe")
	params, _ := syscall.UTF16PtrFromString(fmt.Sprintf("/select,%s", path))

	ret, _, _ := shellExecute.Call(
		0,
		uintptr(unsafe.Pointer(operation)),
		uintptr(unsafe.Pointer(file)),
		uintptr(unsafe.Pointer(params)),
		0,
		1, // SW_SHOWNORMAL
	)

	// ShellExecute 返回值 > 32 表示成功
	if ret <= 32 {
		return fmt.Errorf("无法打开文件位置: %s", path)
	}

	return nil
}
