import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import WailsAPI from '@/utils/wails';
import type { SoftwareInfo, SoftwarePageState } from '@/types';

export default function SoftwarePage() {
  const [pageState, setPageState] = useState<SoftwarePageState>('loading');
  const [softwareList, setSoftwareList] = useState<SoftwareInfo[]>([]);

  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 ** 3);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 ** 2);
    return `${mb.toFixed(0)} MB`;
  };

  const loadSoftware = async () => {
    setPageState('loading');
    
    try {
      const software = await WailsAPI.getInstalledSoftware();
      
      if (software && software.length > 0) {
        setSoftwareList(software);
        setPageState('loaded');
      } else {
        setPageState('empty');
      }
    } catch (error) {
      console.error('Failed to load software:', error);
      setPageState('empty');
    }
  };

  useEffect(() => {
    loadSoftware();
  }, []);

  const getTotalSize = (): number => {
    return softwareList.reduce((sum, soft) => sum + soft.size, 0);
  };

  const renderContent = () => {
    switch (pageState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-primary animate-spin mb-4" />
            <p className="text-gray-600 mb-2">🔍 正在扫描已安装软件...</p>
            <p className="text-sm text-gray-500">已找到: {softwareList.length} 个软件</p>
            <p className="text-sm text-gray-500">正在计算大小...</p>
          </div>
        );

      case 'loaded':
        return (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
              {/* 表头 */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
                <div className="col-span-4">软件名称</div>
                <div className="col-span-6">安装位置</div>
                <div className="col-span-2 text-right">大小</div>
              </div>

              {/* 软件列表 */}
              <div className="divide-y divide-gray-100">
                {softwareList.map((software, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-sm"
                  >
                    <div className="col-span-4 font-medium text-gray-700 truncate">
                      {software.name}
                    </div>
                    <div className="col-span-6 text-gray-600 truncate" title={software.path}>
                      {software.path}
                    </div>
                    <div className="col-span-2 text-right font-medium text-gray-700">
                      {formatSize(software.size)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 统计信息 */}
            <div className="text-sm text-gray-600 mb-4">
              总计: {softwareList.length} 个软件，占用 {formatSize(getTotalSize())}
            </div>

            {/* 刷新按钮 */}
            <button
              onClick={loadSoftware}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw size={16} />
              刷新列表
            </button>
          </>
        );

      case 'empty':
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle size={48} className="text-yellow-500 mb-4" />
            <p className="text-gray-700 font-medium mb-2">⚠️ 未找到已安装软件</p>
            <p className="text-sm text-gray-500 mb-4">无法从注册表读取软件列表</p>
            
            <div className="text-sm text-gray-600 mb-6">
              <p className="mb-1">💡 可能原因：</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>权限不足</li>
                <li>系统注册表异常</li>
              </ul>
            </div>

            <button
              onClick={loadSoftware}
              className="btn-primary"
            >
              重试
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">已安装软件</h2>
      {renderContent()}
    </div>
  );
}
