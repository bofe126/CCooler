import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import WailsAPI from '@/utils/wails';
import type { SoftwareInfo, SoftwarePageState } from '@/types';

interface SoftwarePageProps {
  isFirstVisit?: boolean;
  onOptimizableSpaceUpdate?: (size: number) => void;
  onScanComplete?: () => void;
}

export default function SoftwarePage({ isFirstVisit = true, onOptimizableSpaceUpdate, onScanComplete }: SoftwarePageProps = {}) {
  const [pageState, setPageState] = useState<SoftwarePageState>('loading');
  const [softwareList, setSoftwareList] = useState<SoftwareInfo[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 ** 3);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 ** 2);
    return `${mb.toFixed(0)} MB`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)} 秒`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${minutes} 分 ${secs} 秒`;
  };

  const loadSoftware = async () => {
    setPageState('loading');
    setSoftwareList([]);
    setScanProgress(0);
    setEstimatedTime(0);
    const start = Date.now();
    
    // 模拟进度更新
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 5;
      });
    }, 200);

    // 更新剩余时间估算
    const timeInterval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setScanProgress(prev => {
        if (prev > 5 && prev < 95) {
          const estimated = (elapsed / prev) * (100 - prev);
          setEstimatedTime(estimated);
        }
        return prev;
      });
    }, 500);
    
    try {
      const software = await WailsAPI.getInstalledSoftware();
      
      clearInterval(progressInterval);
      clearInterval(timeInterval);
      setScanProgress(100);
      
      if (software && software.length > 0) {
        setSoftwareList(software);
        setPageState('loaded');

        // 计算并更新可优化空间（软件总大小）
        const totalSize = software.reduce((sum: number, soft: SoftwareInfo) => sum + soft.size, 0);
        onOptimizableSpaceUpdate?.(totalSize);
        
        // 通知父组件扫描完成
        onScanComplete?.();
      } else {
        setPageState('empty');
        onOptimizableSpaceUpdate?.(0);
      }
    } catch (error) {
      clearInterval(progressInterval);
      clearInterval(timeInterval);
      console.error('Failed to load software:', error);
      setPageState('empty');
    }
  };

  useEffect(() => {
    if (isFirstVisit) {
      loadSoftware();
    }
  }, [isFirstVisit]);

  const getTotalSize = (): number => {
    return softwareList.reduce((sum: number, soft: SoftwareInfo) => sum + soft.size, 0);
  };

  const renderContent = () => {
    switch (pageState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-primary animate-spin mb-4" />
            <p className="text-gray-600 mb-4 font-medium">🔍 正在扫描已安装软件...</p>
            
            {/* 进度条 */}
            <div className="w-96 mb-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
            
            {/* 进度信息 */}
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-600">
                进度: <span className="font-semibold text-primary">{Math.floor(scanProgress)}%</span>
              </p>
              {estimatedTime > 0 && scanProgress > 10 && scanProgress < 95 && (
                <p className="text-xs text-gray-500">
                  预计剩余: {formatTime(estimatedTime)}
                </p>
              )}
            </div>
          </div>
        );

      case 'loaded':
        return (
          <>
            {/* 统计卡片 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm text-gray-600">已安装软件:</span>
                  <span className="text-2xl font-bold text-primary">{softwareList.length}</span>
                  <span className="text-sm text-gray-500">个</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-sm text-gray-600">总占用:</span>
                  <span className="text-2xl font-bold text-primary">{formatSize(getTotalSize())}</span>
                </div>
                <button
                  onClick={loadSoftware}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  刷新
                </button>
              </div>
            </div>

            {/* 软件列表 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              {/* 表头 */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 text-sm font-semibold text-gray-700">
                <div className="col-span-1">图标</div>
                <div className="col-span-4">软件名称</div>
                <div className="col-span-5">安装位置</div>
                <div className="col-span-2 text-right">大小</div>
              </div>

              {/* 软件列表 */}
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {softwareList.map((software, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-blue-50 transition-colors text-sm items-center"
                  >
                    <div className="col-span-1 flex items-center justify-center">
                      {software.icon ? (
                        <img 
                          src={software.icon} 
                          alt={software.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                            if (sibling) sibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center text-white text-xs font-bold"
                        style={{ display: software.icon ? 'none' : 'flex' }}
                      >
                        {software.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="col-span-4 font-medium text-gray-800 truncate">
                      {software.name}
                    </div>
                    <div className="col-span-5 text-gray-600 truncate text-xs" title={software.path}>
                      {software.path}
                    </div>
                    <div className="col-span-2 text-right font-semibold text-primary">
                      {formatSize(software.size)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
      <h2 className="text-lg font-semibold mb-4 text-gray-700">软件瘦身</h2>
      {renderContent()}
    </div>
  );
}
