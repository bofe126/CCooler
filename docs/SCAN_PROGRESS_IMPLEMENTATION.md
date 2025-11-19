# 扫描进度优化实现方案

## 需求
1. 每个清理项独立扫描线程，避免卡死
2. 每个清理项显示圆形进度条

## 后端实现

### 新增 API

```go
// ScanSingleCleanItem 扫描单个清理项
func (a *App) ScanSingleCleanItem(itemID string) (*models.CleanItem, error)
```

### 修改点
- ✅ 导出 `ScanSingleItem` 方法
- ✅ 添加单个清理项扫描 API
- ✅ 支持独立扫描每个清理项

## 前端实现

### 1. 修改扫描逻辑

**原逻辑**：一次性扫描所有清理项
```typescript
const items = await WailsAPI.scanCleanItems();
```

**新逻辑**：独立扫描每个清理项
```typescript
// 初始化清理项列表（状态为 idle）
const initialItems = [
  { id: '1', name: '系统临时文件', status: 'idle', ... },
  { id: '2', name: '浏览器缓存', status: 'idle', ... },
  // ...
];

// 独立扫描每个清理项
initialItems.forEach(async (item) => {
  // 更新状态为 scanning
  updateItemStatus(item.id, 'scanning');
  
  try {
    // 调用单个清理项扫描 API
    const scannedItem = await WailsAPI.scanSingleCleanItem(item.id);
    
    // 更新扫描结果
    updateItem(scannedItem);
  } catch (error) {
    // 更新为错误状态
    updateItemStatus(item.id, 'error');
  }
});
```

### 2. 圆形进度条组件

创建 `CircularProgress` 组件：

```typescript
interface CircularProgressProps {
  status: 'idle' | 'scanning' | 'scanned' | 'cleaning' | 'completed' | 'error';
  size?: number;
}

export function CircularProgress({ status, size = 24 }: CircularProgressProps) {
  if (status === 'scanning' || status === 'cleaning') {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="animate-spin" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }
  
  if (status === 'scanned' || status === 'completed') {
    return <CheckCircle className="text-green-500" size={size} />;
  }
  
  if (status === 'error') {
    return <XCircle className="text-red-500" size={size} />;
  }
  
  return <Circle className="text-gray-300" size={size} />;
}
```

### 3. 更新 CleanItemList 组件

```typescript
// 在每个清理项右侧显示进度
<div className="flex items-center gap-2">
  <CircularProgress status={item.status} />
  <span className="text-sm text-gray-500">
    {getStatusText(item.status)}
  </span>
</div>
```

### 4. 状态文本映射

```typescript
function getStatusText(status: string): string {
  switch (status) {
    case 'idle':
      return '等待扫描';
    case 'scanning':
      return '扫描中...';
    case 'scanned':
      return '扫描完成';
    case 'cleaning':
      return '清理中...';
    case 'completed':
      return '已完成';
    case 'error':
      return '失败';
    default:
      return '';
  }
}
```

### 5. Wails API 包装器更新

```typescript
// frontend/src/utils/wails.ts

export const WailsAPI = {
  // ... 现有方法
  
  // 新增：扫描单个清理项
  scanSingleCleanItem: async (itemID: string) => {
    if (isWailsEnv()) {
      return await window.go.main.App.ScanSingleCleanItem(itemID);
    }
    // 开发环境模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    return {
      id: itemID,
      name: `清理项 ${itemID}`,
      size: Math.random() * 5 * 1024 ** 3,
      fileCount: Math.floor(Math.random() * 10000),
      checked: true,
      safe: true,
      status: 'scanned',
    };
  },
};
```

## 优点

### 1. 独立扫描
- ✅ 每个清理项独立线程
- ✅ 单个失败不影响其他项
- ✅ 用户可以看到实时进度
- ✅ 避免全部卡死

### 2. 用户体验
- ✅ 圆形进度动画更直观
- ✅ 实时反馈扫描状态
- ✅ 可以看到哪些项正在扫描
- ✅ 可以看到哪些项已完成

### 3. 性能
- ✅ 并发扫描，速度更快
- ✅ 不会阻塞 UI
- ✅ 响应更流畅

## 实现步骤

1. ✅ **后端**：添加单个清理项扫描 API
2. ⏳ **前端**：更新 Wails API 包装器
3. ⏳ **前端**：创建圆形进度组件
4. ⏳ **前端**：修改 CleanPage 扫描逻辑
5. ⏳ **前端**：更新 CleanItemList 显示
6. ⏳ **测试**：验证独立扫描和进度显示

## 注意事项

1. **并发控制**：虽然是独立扫描，但后端已经有并发控制（goroutine）
2. **错误处理**：单个清理项失败不应影响其他项
3. **状态同步**：确保前端状态与后端同步
4. **性能考虑**：清理项 8（应用日志文件）扫描时间可能较长，需要特别提示

## 测试场景

1. **正常扫描**：所有清理项都能正常扫描
2. **部分失败**：某些清理项扫描失败，其他项继续
3. **权限不足**：某些清理项需要管理员权限
4. **长时间扫描**：清理项 8 扫描时间较长
5. **取消扫描**：用户可以取消正在进行的扫描（未来功能）
