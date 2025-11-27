# CCoolerElevated - 提权辅助程序

这是 CCooler 的提权辅助程序，用于执行需要管理员权限的操作。

## 构建

### 自动构建（推荐）
在项目根目录运行：
```bash
.\build.bat
```

### 手动构建
```bash
# 1. 生成资源文件（嵌入图标）
rsrc -ico ../build/windows/icon.ico -o elevated.syso

# 2. 编译
go build -ldflags "-H windowsgui -s -w" -o ../build/bin/CCoolerElevated.exe
```

## 图标嵌入

- 使用 `rsrc` 工具将图标嵌入到 exe 文件中
- 图标文件：`build/windows/icon.ico`
- 生成的资源文件：`elevated.syso`（Git 已忽略）

### 安装 rsrc 工具
```bash
# 国际网络
go install github.com/akavel/rsrc@latest

# 国内网络（使用代理）
$env:GOPROXY="https://goproxy.cn,direct"
go install github.com/akavel/rsrc@latest
```

## 工作原理

1. 主程序通过 HTTP 服务器监听随机端口
2. 需要管理员权限时，使用 `ShellExecute("runas")` 启动此程序
3. 弹出 UAC 提示，用户同意后获得管理员权限
4. 执行清理任务，通过 HTTP POST 回传结果和进度
5. 日志记录到 `CCoolerElevated.log`

## 支持的任务

- `clean-item-{id}` - 清理指定 ID 的清理项
- `clean-batch` - 批量清理多个路径（单次 UAC）
- `optimize-hibernation` - 禁用休眠
- `optimize-restore` - 清理系统还原点
- `optimize-pagefile` - 禁用虚拟内存

## 重要提示

- **必须与主程序在同一目录**：主程序会在自己所在目录查找此 exe
- **不要单独运行**：此程序仅供主程序调用，单独运行无效果
- **日志文件**：执行记录保存在 `CCoolerElevated.log`
