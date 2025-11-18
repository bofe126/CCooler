package models

// CleanItem 清理项
type CleanItem struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Size    int64  `json:"size"`
	Checked bool   `json:"checked"`
	Safe    bool   `json:"safe"`
	Status  string `json:"status"`
	Error   string `json:"error,omitempty"`
}

// DiskInfo 磁盘信息
type DiskInfo struct {
	Total int64 `json:"total"`
	Used  int64 `json:"used"`
	Free  int64 `json:"free"`
}

// SoftwareInfo 软件信息
type SoftwareInfo struct {
	Name string `json:"name"`
	Path string `json:"path"`
	Size int64  `json:"size"`
}

// WeChatData 微信数据
type WeChatData struct {
	InstallPath string `json:"installPath"`
	DataPath    string `json:"dataPath"`
	ChatSize    int64  `json:"chatSize"`
	FileSize    int64  `json:"fileSize"`
	MediaSize   int64  `json:"mediaSize"`
	OtherSize   int64  `json:"otherSize"`
	Total       int64  `json:"total"`
}

// ScanProgress 扫描进度
type ScanProgress struct {
	Current int    `json:"current"`
	Total   int    `json:"total"`
	Item    string `json:"item"`
	Size    int64  `json:"size"`
}

// CleanProgress 清理进度
type CleanProgress struct {
	Current   int    `json:"current"`
	Total     int    `json:"total"`
	Item      string `json:"item"`
	Cleaned   int64  `json:"cleaned"`
	TotalSize int64  `json:"totalSize"`
}
