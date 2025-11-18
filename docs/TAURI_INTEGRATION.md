# Tauri 集成指南

由于系统未安装 Rust，当前项目使用纯前端实现和模拟API。以下是集成 Tauri 的步骤。

## 前置要求

### 1. 安装 Rust
访问 https://rustup.rs/ 下载并安装 Rust

```powershell
# 验证安装
rustc --version
cargo --version
```

### 2. 安装 Tauri CLI

```bash
npm install -g @tauri-apps/cli
```

## 集成步骤

### 1. 初始化 Tauri

在 `ccooler-app` 目录下运行：

```bash
npm install @tauri-apps/api
npm install -D @tauri-apps/cli
```

初始化 Tauri：

```bash
npm run tauri init
```

配置选项：
- App name: CCooler
- Window title: CCooler
- Web assets location: ../dist
- Dev server URL: http://localhost:5173
- Frontend dev command: npm run dev
- Frontend build command: npm run build

### 2. 配置 Tauri

编辑 `src-tauri/tauri.conf.json`:

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "CCooler",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "fs": {
        "all": false,
        "readDir": true,
        "readFile": true,
        "removeDir": true,
        "removeFile": true
      },
      "dialog": {
        "all": false,
        "ask": true,
        "message": true
      }
    },
    "windows": [
      {
        "title": "CCooler",
        "width": 800,
        "height": 600,
        "resizable": false,
        "center": true,
        "decorations": false,
        "transparent": false
      }
    ]
  }
}
```

### 3. 实现 Rust 后端命令

在 `src-tauri/src/main.rs` 中实现以下命令：

#### 获取磁盘信息
```rust
#[tauri::command]
fn get_disk_info() -> Result<DiskInfo, String> {
    // 实现磁盘信息获取
}
```

#### 扫描清理项
```rust
#[tauri::command]
fn scan_clean_items() -> Result<Vec<CleanItem>, String> {
    // 实现文件扫描
}
```

#### 清理文件
```rust
#[tauri::command]
fn clean_files(item_ids: Vec<u32>) -> Result<CleanResult, String> {
    // 实现文件清理
}
```

#### 获取已安装软件
```rust
#[tauri::command]
fn get_installed_software() -> Result<Vec<Software>, String> {
    // 读取注册表获取软件列表
}
```

#### 获取微信信息
```rust
#[tauri::command]
fn get_wechat_info() -> Result<WeChatInfo, String> {
    // 检测微信安装和数据目录
}
```

#### 打开微信
```rust
#[tauri::command]
fn open_wechat() -> Result<(), String> {
    // 启动微信程序
}
```

### 4. 更新前端 API

修改 `src/api/mock.js` 为 `src/api/index.js`:

```javascript
import { invoke } from '@tauri-apps/api/tauri'

export const api = {
  getDiskInfo: async () => {
    return await invoke('get_disk_info')
  },

  scanCleanItems: async () => {
    return await invoke('scan_clean_items')
  },

  cleanFiles: async (itemIds) => {
    return await invoke('clean_files', { itemIds })
  },

  getInstalledSoftware: async () => {
    return await invoke('get_installed_software')
  },

  getWeChatInfo: async () => {
    return await invoke('get_wechat_info')
  },

  openWeChat: async () => {
    return await invoke('open_wechat')
  },
}
```

### 5. 更新 TitleBar 组件

```javascript
import { appWindow } from '@tauri-apps/api/window'

const handleMinimize = () => {
  appWindow.minimize()
}

const handleClose = () => {
  appWindow.close()
}
```

### 6. 运行和构建

开发模式：
```bash
npm run tauri dev
```

构建应用：
```bash
npm run tauri build
```

## Rust 依赖

在 `src-tauri/Cargo.toml` 中添加：

```toml
[dependencies]
tauri = { version = "1.5", features = ["shell-open", "dialog-ask"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
winreg = "0.50"  # Windows 注册表
walkdir = "2.4"  # 文件遍历
```

## 需要实现的功能模块

1. **磁盘管理模块** - 获取磁盘使用情况
2. **文件扫描模块** - 扫描临时文件、缓存等
3. **文件清理模块** - 安全删除文件
4. **注册表读取模块** - 获取已安装软件
5. **进程管理模块** - 启动外部程序
6. **权限管理模块** - 请求管理员权限

## 安全注意事项

- 所有文件删除操作需要用户确认
- 系统文件清理需要管理员权限
- 添加文件删除前的备份机制
- 实现清理日志记录
