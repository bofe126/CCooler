import { ReactNode } from 'react';
import Titlebar from './Titlebar';
import Sidebar from './Sidebar';
import type { PageType } from '@/types';

interface MainLayoutProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  children: ReactNode;
}

export default function MainLayout({ currentPage, onPageChange, children }: MainLayoutProps) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* 标题栏 */}
      <Titlebar />

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <Sidebar currentPage={currentPage} onPageChange={onPageChange} />

        {/* 页面内容 */}
        <div className="flex-1 bg-background overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
