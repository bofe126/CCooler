# CCooler 开发文档

## 📋 目录

- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [功能实现](#功能实现)
- [API 文档](#api-文档)
- [开发指南](#开发指南)
- [常见问题](#常见问题)

---

## 项目结构

```
CCooler/
├── backend/              # Go 后端代码
│   ├── models/          # 数据模型
│   │   └── types.go
│   └── services/        # 业务服务
│       ├── admin_service.go    # 权限管理
│       ├── clean_service.go    # 清理服务
│       ├── software_service.go # 软件统计
│       └── wechat_service.go   # 微信服务
├── frontend/            # React 前端代码
│   ├── src/
│   │   ├── components/  # UI 组件
│   │   │   ├── Layout/          # 布局组件
│   │   │   └── CleanPage/       # 清理页面组件
│   │   ├── pages/       # 页面
│   │   ├── styles/      # 样式
│   │   ├── types/       # 类型定义
│   │   └── utils/       # 工具函数（Wails API）
│   ├── package.json
│   └── vite.config.ts
├── docs/                # 文档
│   └── UI_DESIGN.md     # UI 设计文档
├── app.go               # Wails 应用主结构
├── main.go              # Go 主程序入口
├── go.mod               # Go 模块配置
└── wails.json           # Wails 配置
```

---

## 快速开始

### 环境要求

- **Go** 1.21+
- **Node.js** 18+
- **Wails CLI** v2.11.0+
- **WebView2** Runtime（Windows）

### 安装依赖

```bash
# 安装 Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# 下载 Go 依赖
go mod tidy

# 安装前端依赖
cd frontend
npm install
```

### 开发模式

```bash
# 启动 Wails 开发服务器（推荐）
wails dev

# 或者仅启动前端（用于 UI 开发）
cd frontend
npm run dev
```

开发服务器会：
- 启动 Go 后端（热重载）
- 启动 Vite 前端开发服务器
- 打开桌面应用窗口
- 自动生成前端绑定代码

### 生产构建

```bash
# 构建可执行文件
wails build

# 构建产物位于 build/bin/
```

---

## 功能实现

### 1. C盘清理功能

#### 磁盘信息获取
- **API**: `GetDiskInfo()`
- **功能**: 获取C盘总容量、已用空间、剩余空间
- **实现**: 使用 Windows API `GetDiskFreeSpaceExW`

#### 清理项扫描
- **API**: `ScanCleanItems()`
- **功能**: 扫描所有可清理项目并计算大小

**清理项列表**:

| ID | 名称 | 路径 | 安全性 | 默认选中 |
|----|------|------|--------|----------|
| 1 | 系统临时文件 | `%TEMP%`, `C:\Windows\Temp` | 安全 | ✓ |
| 2 | 浏览器缓存 | Chrome/Edge/Firefox 缓存 | 安全 | ✓ |
| 3 | 回收站 | `C:\$Recycle.Bin` | 安全 | ✓ |
| 4 | Windows更新缓存 | `C:\Windows\SoftwareDistribution` | 安全 | ✓ |
| 5 | 系统文件清理 | WER报告、缩略图缓存 | 安全 | ✓ |
| 6 | 下载目录 | `%USERPROFILE%\Downloads` | **危险** | ✗ |
| 7 | 应用缓存 | 应用程序缓存目录 | 安全 | ✗ |

#### 清理执行
- **API**: `CleanItems(items)`
- **功能**: 清理选中的项目
- **特性**:
  - 逐项清理，跳过未选中项
  - 错误处理，单项失败不影响其他项
  - 状态反馈（completed/error）
  - 自动跳过正在使用的文件

#### 权限检查
- **API**: `IsAdmin()`, `IsElevated()`
- **功能**: 检查当前进程权限级别
- **用途**: 提示用户某些清理项需要管理员权限

### 2. 软件统计功能

#### 软件列表获取
- **API**: `GetInstalledSoftware()`
- **功能**: 从注册表读取已安装软件
- **数据来源**:
  - `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`
  - `HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall`
- **返回信息**: 软件名称、安装路径、占用空间

### 3. 微信迁移功能

#### 微信检测
- **API**: `DetectWeChat()`
- **功能**: 检测微信安装和数据路径
- **检测方式**:
  1. 从注册表读取安装路径
  2. 检查默认安装路径
  3. 扫描数据目录
- **返回信息**: 安装路径、数据路径、各类数据大小

#### 打开微信
- **API**: `OpenWeChat()`
- **功能**: 启动微信程序

### 4. 清理项详情面板

#### 功能特性
- 抽屉式设计，从右侧滑入
- 显示清理项详细信息、路径列表、文件统计
- 安全等级标识（安全/注意/警告/危险）
- 点击"查看详情"按钮打开

#### 详情内容
每个清理项包含：
- 清理项图标和名称
- 功能说明
- 统计信息（大小、文件数、文件夹数等）
- 详细路径列表
- 权限要求提示
- 安全提示/警告信息

---

## API 文档

### Go 后端 API

#### CleanService
```go
// 获取磁盘信息
GetDiskInfo() (*DiskInfo, error)

// 扫描清理项
ScanCleanItems() ([]*CleanItem, error)

// 清理文件夹
CleanFolder(path string) error

// 安全清理（跳过正在使用的文件）
CleanFolderSafe(path string) (int64, error)

// 清空回收站
EmptyRecycleBin() error
```

#### SoftwareService
```go
// 获取已安装软件
GetInstalledSoftware() ([]*SoftwareInfo, error)
```

#### WeChatService
```go
// 检测微信
DetectWeChat() (*WeChatData, error)

// 打开微信
OpenWeChat() error
```

#### AdminService
```go
// 检查管理员权限
IsAdmin() bool

// 检查权限提升
IsElevated() bool
```

### 前端 TypeScript API

所有后端 API 都通过 `WailsAPI` 包装器暴露给前端：

```typescript
import WailsAPI from '@/utils/wails';

// 获取磁盘信息
const diskInfo = await WailsAPI.getDiskInfo();

// 扫描清理项
const items = await WailsAPI.scanCleanItems();

// 清理项目
await WailsAPI.cleanItems(items);

// 获取已安装软件
const software = await WailsAPI.getInstalledSoftware();

// 检测微信
const wechatData = await WailsAPI.detectWeChat();

// 打开微信
await WailsAPI.openWeChat();
```

---

## 开发指南

### 后端开发

#### 添加新的清理项

1. 在 `backend/services/clean_service.go` 中添加扫描逻辑：
```go
case "8": // 新清理项
    newPath := s.GetNewPath()
    size, _ := s.CalculateFolderSize(newPath)
```

2. 在 `app.go` 中添加清理逻辑：
```go
case "8": // 新清理项
    newPath := a.cleanService.GetNewPath()
    err = a.cleanService.CleanFolder(newPath)
```

3. 在前端 `CleanPage.tsx` 中添加到初始列表：
```typescript
{ id: '8', name: '新清理项', size: 0, checked: false, safe: true, status: 'idle' }
```

#### Windows API 调用

使用 `golang.org/x/sys/windows` 包：
```go
import "golang.org/x/sys/windows"

// 示例：获取磁盘空间
var freeBytesAvailable, totalBytes, totalFreeBytes uint64
err := windows.GetDiskFreeSpaceEx(
    windows.StringToUTF16Ptr("C:\\"),
    &freeBytesAvailable,
    &totalBytes,
    &totalFreeBytes,
)
```

### 前端开发

#### 组件规范
- 使用 TypeScript 函数式组件
- Props 类型定义在组件文件或 `types/index.ts`
- 使用 TailwindCSS 工具类
- 自定义样式在 `src/styles/index.css`

#### 状态管理
```typescript
// 页面状态
type CleanPageState = 
  | 'initial' | 'scanning' | 'scan-complete' 
  | 'cleaning' | 'clean-complete' | 'clean-error'

// 清理项状态
type ItemStatus = 
  | 'idle' | 'scanning' | 'scanned' 
  | 'cleaning' | 'completed' | 'error'
```

#### 调用后端 API
```typescript
// 开发模式会使用模拟数据
// 生产模式会调用真实的 Go 后端
const items = await WailsAPI.scanCleanItems();
```

### 样式规范

#### 配色方案
- **主色**: `#3B82F6` (蓝色)
- **成功**: `#10B981` (绿色)
- **警告**: `#F59E0B` (黄色)
- **危险**: `#EF4444` (红色)
- **背景**: `#F9FAFB` (浅灰)

#### 按钮样式
```css
.btn-primary    /* 主按钮 */
.btn-secondary  /* 次按钮 */
.btn-danger     /* 危险按钮 */
.btn-disabled   /* 禁用按钮 */
```

---

## 常见问题

### Q: Wails dev 启动失败？
**A**: 检查：
1. Go 版本 >= 1.21
2. Node.js 已安装
3. WebView2 运行时已安装（Windows）
4. 端口 3000 和 34115 未被占用

### Q: 前端无法调用后端 API？
**A**: 确保：
1. 使用 `wails dev` 启动（不是 `npm run dev`）
2. 检查浏览器控制台错误
3. 确认 `window.go` 对象存在

### Q: 构建后程序无法运行？
**A**: 检查：
1. 目标系统是否安装 WebView2
2. 是否需要管理员权限
3. 查看构建日志错误

### Q: 清理失败怎么办？
**A**: 可能原因：
1. 权限不足 - 以管理员身份运行
2. 文件正在使用 - 关闭相关程序
3. 路径不存在 - 检查路径是否正确

### Q: 如何调试？
**A**: 
- **后端**: 在代码中添加 `fmt.Println()` 查看日志
- **前端**: 使用浏览器开发者工具（F12）
- **Wails**: 查看终端输出

---

## 性能优化

### 已实现
- ✅ 错误容忍（跳过无权限文件）
- ✅ 路径缓存（避免重复计算）
- ✅ 安全清理（不影响系统运行）

### 待优化
- ⏳ 大文件夹扫描进度反馈
- ⏳ 增量扫描（缓存上次结果）
- ⏳ 并发清理
- ⏳ 后台扫描（不阻塞UI）

---

## 注意事项

### 权限相关
1. **普通用户权限可以清理**:
   - 用户临时文件
   - 浏览器缓存（浏览器未运行时）
   - 回收站
   - 下载目录
   - 应用缓存

2. **需要管理员权限**:
   - 系统临时文件（`C:\Windows\Temp`）
   - Windows更新缓存
   - 系统文件清理

3. **权限不足时的处理**:
   - 显示友好错误提示
   - 标记失败项
   - 继续清理其他项

### 安全性
1. **危险操作标记**:
   - 下载目录默认不选中
   - 清理前需要用户确认

2. **文件保护**:
   - 跳过正在使用的文件
   - 保留文件夹结构
   - 只删除内容，不删除文件夹本身

3. **错误恢复**:
   - 单项失败不影响其他项
   - 详细错误信息反馈
   - 不会中断整个清理过程

---

## 许可证

MIT License
