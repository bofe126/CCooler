import { Trash2, BarChart3, MessageSquare, HardDrive, Settings, Monitor } from 'lucide-react';
import type { PageType } from '@/types';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
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

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`
                relative w-full py-4 px-6 flex items-center gap-3 
                transition-all duration-200 cursor-pointer
                ${isActive 
                  ? 'bg-blue-50 text-primary font-medium' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              {/* 左侧蓝色竖条 */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
              )}

              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
