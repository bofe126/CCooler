import { Trash2, BarChart3, MessageSquare } from 'lucide-react';
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
      label: 'C盘清理',
    },
    {
      id: 'software' as PageType,
      icon: BarChart3,
      label: '软件统计',
    },
    {
      id: 'wechat' as PageType,
      icon: MessageSquare,
      label: '微信迁移',
    },
  ];

  return (
    <div className="w-[120px] bg-white border-r border-gray-200 flex flex-col">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`
              relative py-4 px-4 flex flex-col items-center gap-2 
              transition-colors cursor-pointer
              ${isActive 
                ? 'bg-blue-50 text-primary' 
                : 'text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            {/* 左侧蓝色竖条 */}
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            )}

            <Icon size={24} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
