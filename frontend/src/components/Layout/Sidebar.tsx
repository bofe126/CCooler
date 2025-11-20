import { Trash2, BarChart3, MessageSquare, HardDrive, Settings, Monitor } from 'lucide-react';
import type { PageType } from '@/types';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  optimizableSpace?: Record<PageType, number>;
}

export default function Sidebar({ currentPage, onPageChange, optimizableSpace }: SidebarProps) {
  // 格式化大小显示
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '';
    const gb = bytes / (1024 ** 3);
    if (gb >= 1) return `${gb.toFixed(1)}GB`;
    const mb = bytes / (1024 ** 2);
    if (mb >= 1) return `${mb.toFixed(0)}MB`;
    return `${bytes}B`;
  };
  const menuItems = [
    {
      id: 'clean' as PageType,
      icon: Trash2,
      label: '系统清理',
    },
    {
      id: 'desktop' as PageType,
      icon: Monitor,
      label: '桌面清理',
    },
    {
      id: 'largefile' as PageType,
      icon: HardDrive,
      label: '大文件清理',
    },
    {
      id: 'optimize' as PageType,
      icon: Settings,
      label: '设置优化',
    },
    {
      id: 'software' as PageType,
      icon: BarChart3,
      label: '软件瘦身',
    },
    {
      id: 'wechat' as PageType,
      icon: MessageSquare,
      label: '微信迁移',
    },
  ];

  return (
    <div className="w-[200px] bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const spaceSize = optimizableSpace?.[item.id] || 0;
          const formattedSize = formatSize(spaceSize);

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`
                relative w-full py-3 px-4 flex items-center justify-between 
                transition-all duration-200 cursor-pointer group
                ${isActive 
                  ? 'bg-blue-50 text-primary font-medium' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              {/* 左侧图标和文字 */}
              <div className="flex items-center gap-3">
                {/* 左侧蓝色竖条 */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                )}

                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-sm">{item.label}</span>
              </div>

              {/* 右侧可优化空间 */}
              {formattedSize && (
                <div className="flex items-center gap-1">
                  <span className={`
                    text-xs font-medium px-2 py-0.5 rounded-full
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }
                  `}>
                    {formattedSize}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
