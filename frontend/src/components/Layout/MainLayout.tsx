import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import DiskStatus from '../CleanPage/DiskStatus';
import WailsAPI from '@/utils/wails';
import type { PageType, DiskInfo } from '@/types';

interface MainLayoutProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  children: ReactNode;
  cleanedSize?: number;
  showCleanedTip?: boolean;
  optimizableSpace?: Record<PageType, number>;
}

export default function MainLayout({ 
  currentPage, 
  onPageChange, 
  children,
  cleanedSize = 0,
  showCleanedTip = false,
  optimizableSpace
}: MainLayoutProps) {
  // 磁盘信息
  const [diskInfo, setDiskInfo] = useState<DiskInfo>({
    total: 300 * 1024 ** 3,
    used: 195 * 1024 ** 3,
    free: 105 * 1024 ** 3,
  });

  // 加载磁盘信息
  useEffect(() => {
    const loadDiskInfo = async () => {
      try {
        const info = await WailsAPI.getDiskInfo();
        setDiskInfo(info);
      } catch (error) {
        console.error('Failed to load disk info:', error);
      }
    };
    
    loadDiskInfo();
    
    // 每30秒刷新一次磁盘信息
    const interval = setInterval(loadDiskInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  // 监听清理完成事件，刷新磁盘信息
  useEffect(() => {
    if (showCleanedTip) {
      const refreshDiskInfo = async () => {
        try {
          const info = await WailsAPI.getDiskInfo();
          setDiskInfo(info);
        } catch (error) {
          console.error('Failed to refresh disk info:', error);
        }
      };
      refreshDiskInfo();
    }
  }, [showCleanedTip]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      {/* 全局顶部 - 应用标题 + C盘状态栏 */}
      <div className="border-b border-gray-200">
        <div className="flex items-center">
          {/* 应用标题 - 渐变科技风 + 图标 */}
          <div className="w-[200px] px-6 py-4 bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-bold">C</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  C-Cooler
                </h1>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1 ml-10 font-medium">极速冷却C盘 ❄️</p>
          </div>
          
          {/* C盘状态 - 白色背景 */}
          <div className="flex-1 px-6 py-4 bg-white">
            <DiskStatus 
              diskInfo={diskInfo}
              cleanedSize={cleanedSize}
              showCleanedTip={showCleanedTip}
            />
          </div>
        </div>
      </div>

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 */}
        <Sidebar currentPage={currentPage} onPageChange={onPageChange} optimizableSpace={optimizableSpace} />

        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
