package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// cleanPathsWithProgress 清理指定的路径列表，并定期报告进度
func cleanPathsWithProgress(paths []string, port string) *TaskResult {
	result := &TaskResult{Success: true}
	totalPaths := len(paths)

	for i, path := range paths {
		if path == "" {
			continue
		}

		// 发送路径切换进度
		progress := &ProgressUpdate{
			ProcessedPaths: i,
			TotalPaths:     totalPaths,
			CleanedSize:    result.CleanedSize,
			CleanedCount:   result.CleanedCount,
			CurrentPath:    path,
		}
		sendProgress(port, progress)

		// 清理路径（带定时进度报告）
		size, count := removeDirectoryWithProgress(path, port, i, totalPaths, result)
		result.CleanedSize += size
		result.CleanedCount += count
	}

	// 发送最终进度
	finalProgress := &ProgressUpdate{
		ProcessedPaths: totalPaths,
		TotalPaths:     totalPaths,
		CleanedSize:    result.CleanedSize,
		CleanedCount:   result.CleanedCount,
		CurrentPath:    "完成",
	}
	sendProgress(port, finalProgress)

	return result
}

// sendProgress 发送进度更新到主程序
func sendProgress(port string, progress *ProgressUpdate) {
	url := "http://127.0.0.1:" + port + "/elevated-progress"

	data, _ := json.Marshal(progress)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(data))
	if err != nil {
		// 进度发送失败不影响清理继续
		return
	}
	defer resp.Body.Close()
}

// removeDirectoryWithProgress 清理目录并定期发送进度
func removeDirectoryWithProgress(path, port string, pathIndex, totalPaths int, result *TaskResult) (int64, int) {
	var totalSize int64
	var count int

	// 启动定时器，每2秒发送一次进度
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	done := make(chan struct{})

	// 后台goroutine定期发送进度
	go func() {
		for {
			select {
			case <-ticker.C:
				// 发送当前进度
				progress := &ProgressUpdate{
					ProcessedPaths: pathIndex,
					TotalPaths:     totalPaths,
					CleanedSize:    result.CleanedSize + totalSize,
					CleanedCount:   result.CleanedCount + count,
					CurrentPath:    path,
				}
				sendProgress(port, progress)
			case <-done:
				return
			}
		}
	}()

	// 执行清理
	filepath.Walk(path, func(filePath string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // 跳过无法访问的文件
		}

		if !info.IsDir() {
			totalSize += info.Size()
			count++
			os.Remove(filePath) // 忽略错误
		}
		return nil
	})

	// 停止定时器
	close(done)

	return totalSize, count
}
