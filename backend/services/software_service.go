package services

import (
	"ccooler/backend/models"
	"os"
	"path/filepath"

	"golang.org/x/sys/windows/registry"
)

type SoftwareService struct{}

func NewSoftwareService() *SoftwareService {
	return &SoftwareService{}
}

// GetInstalledSoftware 获取已安装软件列表
func (s *SoftwareService) GetInstalledSoftware() ([]*models.SoftwareInfo, error) {
	var softwareList []*models.SoftwareInfo

	// 读取注册表中的软件信息
	registryPaths := []string{
		`SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`,
		`SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall`,
	}

	for _, regPath := range registryPaths {
		key, err := registry.OpenKey(registry.LOCAL_MACHINE, regPath, registry.ENUMERATE_SUB_KEYS|registry.QUERY_VALUE)
		if err != nil {
			continue
		}
		defer key.Close()

		subKeys, err := key.ReadSubKeyNames(-1)
		if err != nil {
			continue
		}

		for _, subKeyName := range subKeys {
			subKey, err := registry.OpenKey(key, subKeyName, registry.QUERY_VALUE)
			if err != nil {
				continue
			}

			displayName, _, err := subKey.GetStringValue("DisplayName")
			if err != nil || displayName == "" {
				subKey.Close()
				continue
			}

			installLocation, _, err := subKey.GetStringValue("InstallLocation")
			if err != nil || installLocation == "" {
				subKey.Close()
				continue
			}

			// 计算软件大小
			size := s.calculateDirectorySize(installLocation)

			// 提取图标
			icon := s.extractIcon(subKey, installLocation)

			softwareList = append(softwareList, &models.SoftwareInfo{
				Name: displayName,
				Path: installLocation,
				Size: size,
				Icon: icon,
			})

			subKey.Close()
		}
	}

	return softwareList, nil
}

// extractIcon 提取软件图标（返回图标标识）
func (s *SoftwareService) extractIcon(key registry.Key, installPath string) string {
	// 暂时返回空字符串，让前端使用首字母头像
	// 完整的图标提取需要复杂的 Windows API 调用和图像处理
	// 可以在后续版本中实现
	return ""
}

// calculateDirectorySize 计算目录大小
func (s *SoftwareService) calculateDirectorySize(path string) int64 {
	var size int64

	filepath.Walk(path, func(_ string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() {
			size += info.Size()
		}
		return nil
	})

	return size
}
