package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"
)

type TaskResult struct {
	Success      bool   `json:"success"`
	Error        string `json:"error,omitempty"`
	CleanedSize  int64  `json:"cleanedSize"`
	CleanedCount int    `json:"cleanedCount"`
}

type ProgressUpdate struct {
	ProcessedPaths int    `json:"processedPaths"`
	TotalPaths     int    `json:"totalPaths"`
	CleanedSize    int64  `json:"cleanedSize"`
	CleanedCount   int    `json:"cleanedCount"`
	CurrentPath    string `json:"currentPath"`
}

func main() {
	// 获取辅助程序所在目录
	exePath, err := os.Executable()
	if err != nil {
		log.Fatal("Failed to get executable path:", err)
	}
	exeDir := filepath.Dir(exePath)

	// 创建永久标记文件，证明辅助程序真的运行了
	markerPath := filepath.Join(exeDir, "CCoolerElevated_EXECUTED.txt")
	timestamp := time.Now().Format("2006-01-02 15:04:05")

	// 检查是否以管理员权限运行
	isAdmin := checkIsAdmin()

	content := fmt.Sprintf("=== CCoolerElevated Executed ===\nTime: %s\nPID: %d\nRunning as Admin: %v\n",
		timestamp, os.Getpid(), isAdmin)
	os.WriteFile(markerPath, []byte(content), 0666)

	logPath := filepath.Join(exeDir, "CCoolerElevated.log")

	// 设置日志输出到文件
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		// 如果日志文件创建失败，记录到标记文件
		errMsg := fmt.Sprintf("\nLog file error: %v\nAttempted path: %s\n", err, logPath)
		f, _ := os.OpenFile(markerPath, os.O_APPEND|os.O_WRONLY, 0666)
		if f != nil {
			f.WriteString(errMsg)
			f.Close()
		}
		log.Fatal("Failed to create log file:", err)
	}
	defer logFile.Close()

	log.SetOutput(logFile)
	log.Printf("=== CCoolerElevated Started === (Log: %s)", logPath)

	// 同时也写入标记文件
	f, _ := os.OpenFile(markerPath, os.O_APPEND|os.O_WRONLY, 0666)
	if f != nil {
		f.WriteString(fmt.Sprintf("Log file: %s\n", logPath))
		f.Close()
	}

	// 解析命令行参数
	task := flag.String("task", "", "Task to execute")
	port := flag.String("port", "", "Main program HTTP port")
	paths := flag.String("paths", "", "Paths to clean (comma separated)")
	flag.Parse()

	log.Printf("Args: task=%s, port=%s, paths=%s", *task, *port, *paths)

	if *task == "" || *port == "" || *paths == "" {
		log.Fatal("Usage: CCoolerElevated.exe -task=<task> -port=<port> -paths=<paths>")
	}

	// 执行任务
	log.Println("Executing task...")
	result := executeTask(*task, *paths, *port)
	log.Printf("Task completed: success=%v, size=%d, count=%d", result.Success, result.CleanedSize, result.CleanedCount)

	// 返回结果到主程序
	log.Println("Sending result to main program...")
	sendResult(*port, result)
	log.Println("=== CCoolerElevated Finished ===")
}

func executeTask(task, pathsStr, port string) *TaskResult {
	// 解析路径列表
	paths := strings.Split(pathsStr, "|")

	switch task {
	case "clean-item-1", "clean-item-2", "clean-item-3", "clean-item-4", "clean-item-5", "clean-item-6", "clean-item-7":
		return cleanPathsWithProgress(paths, port)
	default:
		return &TaskResult{
			Success: false,
			Error:   fmt.Sprintf("unknown task: %s", task),
		}
	}
}

func sendResult(port string, result *TaskResult) {
	url := fmt.Sprintf("http://127.0.0.1:%s/elevated-result", port)

	data, _ := json.Marshal(result)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(data))
	if err != nil {
		log.Printf("Failed to send result: %v", err)
		return
	}
	defer resp.Body.Close()
}

// TOKEN_ELEVATION 结构体
type TOKEN_ELEVATION struct {
	TokenIsElevated uint32
}

// checkIsAdmin 检查当前进程是否以管理员权限运行
func checkIsAdmin() bool {
	var token windows.Token
	err := windows.OpenProcessToken(windows.CurrentProcess(), windows.TOKEN_QUERY, &token)
	if err != nil {
		return false
	}
	defer token.Close()

	var elevation TOKEN_ELEVATION
	var returnedLen uint32
	err = windows.GetTokenInformation(
		token,
		windows.TokenElevation,
		(*byte)(unsafe.Pointer(&elevation)),
		uint32(unsafe.Sizeof(elevation)),
		&returnedLen,
	)
	if err != nil {
		return false
	}

	return elevation.TokenIsElevated != 0
}
