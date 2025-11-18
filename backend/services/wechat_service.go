package services

import (
	"ccooler/backend/models"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"golang.org/x/sys/windows/registry"
)

type WeChatService struct{}

func NewWeChatService() *WeChatService {
	return &WeChatService{}
}

// DetectWeChat 检测微信安装
func (s *WeChatService) DetectWeChat() (*models.WeChatData, error) {
	// 从注册表读取微信安装路径
	installPath, err := s.getWeChatInstallPath()
	if err != nil {
		return nil, fmt.Errorf("未检测到微信安装")
	}

	// 获取微信数据路径
	dataPath := s.getWeChatDataPath()

	// 扫描微信数据大小
	chatSize, _ := s.calculateFolderSize(filepath.Join(dataPath, "Msg"))
	fileSize, _ := s.calculateFolderSize(filepath.Join(dataPath, "FileStorage"))
	mediaSize, _ := s.calculateFolderSize(filepath.Join(dataPath, "Data"))
	otherSize, _ := s.calculateFolderSize(dataPath)
	otherSize = otherSize - chatSize - fileSize - mediaSize

	total := chatSize + fileSize + mediaSize + otherSize

	return &models.WeChatData{
		InstallPath: installPath,
		DataPath:    dataPath,
		ChatSize:    chatSize,
		FileSize:    fileSize,
		MediaSize:   mediaSize,
		OtherSize:   otherSize,
		Total:       total,
	}, nil
}

// getWeChatInstallPath 从注册表获取微信安装路径
func (s *WeChatService) getWeChatInstallPath() (string, error) {
	// 尝试从注册表读取
	key, err := registry.OpenKey(registry.CURRENT_USER, `Software\Tencent\WeChat`, registry.QUERY_VALUE)
	if err != nil {
		// 尝试默认路径
		defaultPath := `C:\Program Files\Tencent\WeChat`
		if _, err := os.Stat(filepath.Join(defaultPath, "WeChat.exe")); err == nil {
			return defaultPath, nil
		}
		defaultPath = `C:\Program Files (x86)\Tencent\WeChat`
		if _, err := os.Stat(filepath.Join(defaultPath, "WeChat.exe")); err == nil {
			return defaultPath, nil
		}
		return "", err
	}
	defer key.Close()

	installPath, _, err := key.GetStringValue("InstallPath")
	if err != nil {
		return "", err
	}

	return installPath, nil
}

// getWeChatDataPath 获取微信数据路径
func (s *WeChatService) getWeChatDataPath() string {
	userProfile := os.Getenv("USERPROFILE")

	// 常见的微信数据路径
	possiblePaths := []string{
		filepath.Join(userProfile, `Documents\WeChat Files`),
		filepath.Join(userProfile, `Documents\Tencent Files`),
		filepath.Join(userProfile, `WeChat Files`),
	}

	for _, path := range possiblePaths {
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}

	// 默认返回第一个路径
	return possiblePaths[0]
}

// calculateFolderSize 计算文件夹大小
func (s *WeChatService) calculateFolderSize(path string) (int64, error) {
	var size int64

	err := filepath.Walk(path, func(_ string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() {
			size += info.Size()
		}
		return nil
	})

	return size, err
}

// OpenWeChat 打开微信程序
func (s *WeChatService) OpenWeChat() error {
	installPath, err := s.getWeChatInstallPath()
	if err != nil {
		return err
	}

	wechatExe := filepath.Join(installPath, "WeChat.exe")
	cmd := exec.Command(wechatExe)

	return cmd.Start()
}
