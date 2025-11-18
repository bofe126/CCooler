# CCooler - C盘清理工具

<div align="center">

**基于 Go + Wails + React 构建的现代化 Windows C盘空间清理工具**

[![Wails](https://img.shields.io/badge/Wails-v2-blue.svg)](https://wails.io/)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8.svg)](https://golang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

## ✨ 特性

- 🚀 **高性能** - 基于 Go 和 Wails，原生性能，体积小
- 🎨 **现代化 UI** - 使用 React + TailwindCSS 打造美观界面
- 🔒 **安全可靠** - 不会误删重要文件，提供详细的清理预览
- 📊 **智能分析** - 可视化展示磁盘占用情况
- 🛠️ **功能丰富** - 系统清理、软件管理、微信迁移一站式解决

## 功能特性

- 🧹 **C盘清理** - 系统临时文件、浏览器缓存、回收站、Windows更新缓存
- 📊 **软件统计** - 已安装软件列表及空间占用
- 💬 **微信迁移** - 检测微信路径，统计数据占用，提供迁移引导

## 🚀 快速开始

```bash
# 1. 安装 Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# 2. 初始化项目
wails init -n CCooler -t react

# 3. 开发
wails dev

# 4. 构建
wails build
```

详见 [docs/UI_DESIGN.md](docs/UI_DESIGN.md) 了解界面设计。

## ⚠️ 注意事项

- 系统文件清理需要管理员权限
- 微信数据迁移仅提供引导，不直接操作数据
- 使用前建议备份重要文件

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)
