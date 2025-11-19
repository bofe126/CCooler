# CCooler 清理策略文档

## 📋 概述

本文档详细说明 CCooler 的清理策略，包括扫描的目录、清理规则和安全考虑。

---

## 🌐 浏览器缓存清理

### Chrome 浏览器

#### 📍 扫描的绝对路径

**基础路径**：`%LOCALAPPDATA%\Google\Chrome\User Data\Default`

**清理的目录**：

1. **Cache** - HTTP 缓存
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Google\Chrome\User Data\Default\Cache`
   - 典型大小：~367 MB
   - 说明：网页资源缓存（图片、CSS、JS 等）

2. **Code Cache** - 代码缓存（最大）
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Google\Chrome\User Data\Default\Code Cache`
   - 典型大小：~1380 MB
   - 说明：JavaScript/CSS 编译后的代码缓存

3. **GPUCache** - GPU 缓存
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Google\Chrome\User Data\Default\GPUCache`
   - 典型大小：~5.57 MB
   - 说明：GPU 渲染缓存

4. **Service Worker** - Service Worker 缓存
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Google\Chrome\User Data\Default\Service Worker`
   - 典型大小：~267 MB
   - 说明：PWA 和离线功能缓存

**总计**：约 2.0 GB

#### ❌ 不清理的目录（保护用户体验）

| 目录 | 大小 | 不清理原因 |
|------|------|-----------|
| **Extensions** | ~798 MB | 扩展程序文件，清理会导致扩展失效 |
| **IndexedDB** | ~90 MB | 网站数据库，清理会丢失网站数据 |
| **Local Storage** | ~4 MB | 本地存储，清理会丢失登录状态和设置 |
| **Session Storage** | ~0.22 MB | 会话存储，清理会丢失当前会话数据 |
| **WebStorage** | ~2.52 MB | Web 存储，清理会影响网站功能 |
| **Local Extension Settings** | ~11.9 MB | 扩展设置，清理会丢失扩展配置 |

### Microsoft Edge 浏览器

#### 📍 扫描的绝对路径

**基础路径**：`%LOCALAPPDATA%\Microsoft\Edge\User Data\Default`

**清理的目录**（与 Chrome 结构相同）：

1. **Cache**
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Microsoft\Edge\User Data\Default\Cache`

2. **Code Cache**
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Microsoft\Edge\User Data\Default\Code Cache`

3. **GPUCache**
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Microsoft\Edge\User Data\Default\GPUCache`

4. **Service Worker**
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Microsoft\Edge\User Data\Default\Service Worker`

### Firefox 浏览器

#### 📍 扫描的绝对路径

**基础路径**：`%APPDATA%\Mozilla\Firefox\Profiles`

**清理的目录**：

1. **cache2** - Firefox 缓存
   - 绝对路径：`C:\Users\{用户名}\AppData\Roaming\Mozilla\Firefox\Profiles\{配置文件夹}\cache2`
   - 说明：Firefox 使用配置文件夹，需要动态查找

---

## 🗑️ 系统文件清理

### 1. 系统临时文件

#### 📍 扫描的绝对路径

1. **用户临时文件**
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Temp`
   - 环境变量：`%TEMP%` 或 `%TMP%`

2. **系统临时文件**
   - 绝对路径：`C:\Windows\Temp`
   - 说明：需要管理员权限

### 2. 回收站

#### 📍 扫描的绝对路径

- 绝对路径：`C:\$Recycle.Bin`
- 说明：Windows 回收站根目录

### 3. Windows 更新缓存

#### 📍 扫描的绝对路径

- 绝对路径：`C:\Windows\SoftwareDistribution\Download`
- 说明：Windows 更新下载缓存，可能需要管理员权限

### 4. 系统文件清理

#### 📍 扫描的绝对路径

1. **Windows 错误报告**
   - 绝对路径：`C:\ProgramData\Microsoft\Windows\WER`

2. **缩略图缓存**
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Microsoft\Windows\Explorer`

3. **预读取文件**
   - 绝对路径：`C:\Windows\Prefetch`

4. **系统日志**
   - 绝对路径：`C:\Windows\Logs`
   - 典型大小：~1.5 GB

5. **Windows Installer 缓存**
   - 绝对路径：`C:\Windows\Installer`
   - 典型大小：~292 MB
   - 说明：MSI 安装包缓存

6. **Windows Defender 扫描历史**
   - 绝对路径：`C:\ProgramData\Microsoft\Windows Defender\Scans\History`
   - 典型大小：~2.48 MB

### 5. 下载目录

#### 📍 扫描的绝对路径

- 绝对路径：`C:\Users\{用户名}\Downloads`
- 环境变量：通过 Shell 文件夹获取
- ⚠️ **默认不选中**：用户文件，需谨慎清理

### 6. 应用缓存

#### 📍 扫描的绝对路径

1. **本地应用临时文件**
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Temp`

2. **Internet 缓存**
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Microsoft\Windows\INetCache`

3. **崩溃转储**
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\CrashDumps`

4. **IE/Edge WebCache**
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Microsoft\Windows\WebCache`

5. **Windows 应用缓存**
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Microsoft\Windows\Caches`

6. **UWP 应用缓存**
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\Packages`

#### 开发工具缓存（如果存在）

7. **Gradle 缓存**
   - 绝对路径：`C:\Users\{用户名}\.gradle\caches`
   - 典型大小：几 GB（开发者）

8. **Maven 仓库**
   - 绝对路径：`C:\Users\{用户名}\.m2\repository`
   - 典型大小：几 GB（开发者）

9. **Python pip 缓存**
   - 绝对路径：`C:\Users\{用户名}\AppData\Local\pip\cache`

10. **npm 缓存**
    - 绝对路径：`C:\Users\{用户名}\AppData\Local\npm-cache`

---

## 🛡️ 安全策略

### 清理前检查

1. **路径存在性检查**
   - 扫描前验证路径是否存在
   - 路径不存在时跳过，不报错

2. **权限检查**
   - 检测是否有足够权限访问目录
   - 权限不足时记录跳过的文件数量

3. **文件占用检查**
   - 跳过正在使用的文件
   - 浏览器运行时提示用户关闭浏览器

### 清理规则

1. **保留目录结构**
   - 只删除目录内容，保留目录本身
   - 避免破坏应用程序结构

2. **错误处理**
   - 单个文件删除失败不影响其他文件
   - 记录删除失败的文件，继续清理

3. **用户确认**
   - 显示清理预览，包含文件数量和大小
   - 用户确认后才执行清理操作

### 默认选中策略

| 清理项 | 默认选中 | 安全等级 | 原因 |
|--------|---------|---------|------|
| 系统临时文件 | ✅ 是 | 🟢 安全 | 系统自动生成，可安全删除 |
| 浏览器缓存 | ✅ 是 | 🟢 安全 | 只清理缓存，不影响数据 |
| 回收站 | ✅ 是 | 🟢 安全 | 用户已删除的文件 |
| Windows 更新缓存 | ✅ 是 | 🟢 安全 | 更新完成后的残留文件 |
| 系统文件清理 | ✅ 是 | 🟢 安全 | 系统日志和缓存 |
| 下载目录 | ❌ 否 | 🔴 危险 | 用户文件，可能包含重要下载 |
| 应用缓存 | ❌ 否 | 🟡 谨慎 | 可能包含应用数据 |

---

## 📊 预期清理效果

### 典型清理大小（基于测试系统）

| 清理项 | 预期大小 | 说明 |
|--------|---------|------|
| Chrome 浏览器缓存 | 2.0 GB | 主要是 Code Cache |
| Edge 浏览器缓存 | 1.5 GB | 如果使用 Edge |
| 系统临时文件 | 500 MB - 2 GB | 取决于使用时间 |
| Windows 更新缓存 | 1 GB - 10 GB | 取决于更新历史 |
| 系统日志 | 1.5 GB | Windows\Logs |
| Windows Installer | 300 MB | MSI 缓存 |
| 回收站 | 变化很大 | 取决于用户删除的文件 |

**总计**：通常可清理 **5 GB - 20 GB** 空间

---

## 🔄 更新日志

### v1.0.0 (2025-11-19)

- ✅ 实现 Chrome 完整缓存扫描（4个目录，约2GB）
- ✅ 实现 Edge 完整缓存扫描
- ✅ 添加 Windows Installer 缓存清理
- ✅ 添加系统日志清理
- ✅ 添加开发工具缓存扫描（Gradle、Maven、pip、npm）
- ✅ 优化安全策略，保护用户数据

---

## 📝 注意事项

1. **浏览器缓存**
   - 清理后首次访问网站可能较慢（需要重新下载资源）
   - 不会丢失登录状态和书签
   - 不会影响扩展程序

2. **系统文件**
   - 某些系统文件需要管理员权限
   - 建议以管理员身份运行以获得最佳清理效果

3. **开发工具缓存**
   - Gradle/Maven 缓存清理后，项目构建时会重新下载依赖
   - 建议开发者谨慎清理

4. **下载目录**
   - 默认不清理，避免误删重要文件
   - 用户需手动选择才会清理

---

## 🔗 相关文档

- [DEVELOPMENT.md](../DEVELOPMENT.md) - 开发文档
- [UI_DESIGN.md](UI_DESIGN.md) - 界面设计文档
- [README.md](../README.md) - 项目说明
