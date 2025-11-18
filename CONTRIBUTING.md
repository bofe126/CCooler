# 贡献指南

感谢你考虑为 CCooler 做出贡献！

## 如何贡献

### 报告 Bug

如果你发现了 bug，请创建一个 Issue 并包含以下信息：

- 问题的详细描述
- 复现步骤
- 预期行为
- 实际行为
- 系统环境（Windows 版本、应用版本等）
- 相关截图或日志

### 提交功能建议

我们欢迎新功能建议！请创建 Issue 并说明：

- 功能的详细描述
- 使用场景
- 可能的实现方案

### 提交代码

1. **Fork 仓库**
   ```bash
   git clone https://github.com/your-username/CCooler.git
   cd CCooler
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **开发**
   - 遵循现有代码风格
   - 添加必要的注释
   - 确保代码通过 lint 检查

4. **测试**
   ```bash
   cd ccooler-app
   npm run lint
   npm run dev  # 测试功能
   ```

5. **提交**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 代码规范

### 前端 (React)

- 使用函数式组件和 Hooks
- 组件文件使用 PascalCase 命名
- 使用 ESLint 进行代码检查
- 保持组件职责单一

### 后端 (Rust)

- 遵循 Rust 官方代码风格
- 使用 `cargo fmt` 格式化代码
- 使用 `cargo clippy` 检查代码质量
- 添加必要的错误处理

## Commit 规范

使用语义化提交信息：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

示例：
```
feat: add browser cache cleaning feature
fix: resolve memory leak in scan process
docs: update installation guide
```

## 开发环境设置

详见 [README.md](./README.md) 的快速开始部分。

## 问题？

如有任何问题，欢迎创建 Issue 或在讨论区提问。

再次感谢你的贡献！🎉
