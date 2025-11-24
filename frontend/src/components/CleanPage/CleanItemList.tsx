import { Check } from 'lucide-react';
import CircularProgress from '@/components/CircularProgress';
import type { CleanItem } from '@/types';

interface CleanItemListProps {
  items: CleanItem[];
  onToggle: (id: string) => void;
  onViewDetail?: (item: CleanItem) => void;
  disabled?: boolean;
}

export default function CleanItemList({ items, onToggle, onViewDetail, disabled }: CleanItemListProps) {
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '-- GB';
    const gb = bytes / (1024 ** 3);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 ** 2);
    return `${mb.toFixed(0)} MB`;
  };

  const getStatusText = (item: CleanItem): string => {
    switch (item.status) {
      case 'scanning':
        return '扫描中...';
      case 'cleaning':
        return '清理中...';
      case 'idle':
        return '等待中...';
      case 'error':
        return item.error || '失败';
      case 'completed':
        return '已清理';
      case 'scanned':
        return formatSize(item.size);
      default:
        return formatSize(item.size);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
        >
          {/* 复选框 */}
          <button
            onClick={() => !disabled && onToggle(item.id)}
            disabled={disabled}
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center
              transition-colors
              ${item.checked 
                ? 'bg-primary border-primary' 
                : 'border-gray-300 hover:border-primary'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            {item.checked && <Check size={14} className="text-white" />}
          </button>

          {/* 清理项名称 */}
          <span className="flex-1 text-sm font-medium text-gray-700">
            {item.name}
          </span>

          {/* 大小或状态文字 */}
          <span className={`
            text-sm font-medium min-w-[80px] text-right
            ${item.status === 'error' ? 'text-danger' : 'text-gray-600'}
          `}>
            {getStatusText(item)}
          </span>

          {/* 圆形进度状态 */}
          <div className="ml-3">
            <CircularProgress status={item.status} size={18} />
          </div>

          {/* 查看详情按钮 - 固定宽度占位 */}
          <div className="w-[64px] flex justify-end">
            {onViewDetail && item.status === 'scanned' && (
              <button
                onClick={() => onViewDetail(item)}
                className="text-xs text-primary hover:text-primary-dark transition-colors underline"
              >
                查看详情
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
