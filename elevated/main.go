package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
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

	if *task == "" || *port == "" {
		log.Fatal("Usage: CCoolerElevated.exe -task=<task> -port=<port> [-paths=<paths>]")
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
	case "clean-batch":
		// 批量清理多个项目（单次UAC）
		log.Printf("Batch cleaning %d paths", len(paths))
		return cleanPathsWithProgress(paths, port)
	case "optimize-hibernation":
		// 禁用休眠
		return executeSystemCommand("powercfg", "/hibernate", "off")
	case "optimize-restore":
		// 清理系统还原点
		return executeSystemCommand("vssadmin", "delete", "shadows", "/all", "/quiet")
	case "optimize-pagefile":
		// 禁用虚拟内存
		return disablePagefile()
	default:
		return &TaskResult{
			Success: false,
			Error:   fmt.Sprintf("unknown task: %s", task),
		}
	}
}

// gbkToUtf8 将 GBK 编码转换为 UTF-8
func gbkToUtf8(s []byte) (string, error) {
	reader := transform.NewReader(bytes.NewReader(s), simplifiedchinese.GBK.NewDecoder())
	buf := new(bytes.Buffer)
	_, err := buf.ReadFrom(reader)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

// executeSystemCommand 执行系统命令
func executeSystemCommand(name string, args ...string) *TaskResult {
	cmd := exec.Command(name, args...)
	output, err := cmd.CombinedOutput()

	if err != nil {
		// 转换 GBK 输出为 UTF-8
		outputStr, convErr := gbkToUtf8(output)
		if convErr != nil {
			outputStr = string(output) // 转换失败则使用原始输出
		}
		return &TaskResult{
			Success: false,
			Error:   fmt.Sprintf("命令执行失败: %v, 输出: %s", err, outputStr),
		}
	}

	return &TaskResult{
		Success: true,
	}
}

// disablePagefile 禁用虚拟内存
func disablePagefile() *TaskResult {
	// 使用注册表方法禁用虚拟内存
	psScript := `Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management' -Name 'PagingFiles' -Type MultiString -Value @()`
	return executeSystemCommand("powershell", "-NoProfile", "-NonInteractive", "-Command", psScript)
}

func sendResult(port string, result *TaskResult) {
	url := fmt.Sprintf("http://127.0.0.1:%s/elevated-result", port)

	data, err := json.Marshal(result)
	if err != nil {
		log.Printf("Failed to marshal result: %v", err)
		return
	}

	log.Printf("Sending result to %s: %s", url, string(data))

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(data))
	if err != nil {
		log.Printf("Failed to send result: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Server returned non-OK status: %d", resp.StatusCode)
	} else {
		log.Printf("Result sent successfully")
	}
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
