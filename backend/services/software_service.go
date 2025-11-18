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

			softwareList = append(softwareList, &models.SoftwareInfo{
				Name: displayName,
				Path: installLocation,
				Size: size,
			})

			subKey.Close()
		}
	}

	return softwareList, nil
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
