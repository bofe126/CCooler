import { useState, useEffect } from 'react';
import { Search, Trash2, Lightbulb, CheckCircle } from 'lucide-react';
import DiskStatus from '@/components/CleanPage/DiskStatus';
import CleanItemList from '@/components/CleanPage/CleanItemList';
import CleanItemDetail from '@/components/CleanPage/CleanItemDetail';
import WailsAPI from '@/utils/wails';
import type { CleanItem, CleanPageState, DiskInfo } from '@/types';

export default function CleanPage() {
  // 磁盘信息
  const [diskInfo, setDiskInfo] = useState<DiskInfo>({
    total: 300 * 1024 ** 3, // 300 GB
    used: 195 * 1024 ** 3,  // 195 GB
    free: 105 * 1024 ** 3,  // 105 GB
  });

  // 加载磁盘信息并自动开始扫描
  useEffect(() => {
    const loadDiskInfo = async () => {
      try {
        const info = await WailsAPI.getDiskInfo();
        setDiskInfo(info);
      } catch (error) {
        console.error('Failed to load disk info:', error);
      }
    };
    
    const autoScan = async () => {
      // 自动开始扫描
      setPageState('scanning');
      try {
        const items = await WailsAPI.scanCleanItems();
        setCleanItems(items);
        setPageState('scan-complete');
      } catch (error) {
        console.error('Auto scan failed:', error);
        setPageState('initial');
      }
    };
    
    loadDiskInfo();
    autoScan();
  }, []);

  // 页面状态
  const [pageState, setPageState] = useState<CleanPageState>('initial');

  // 详情面板
  const [selectedItem, setSelectedItem] = useState<CleanItem | null>(null);

  // 清理项列表
  const [cleanItems, setCleanItems] = useState<CleanItem[]>([
    { id: '1', name: '系统临时文件', size: 0, fileCount: 0, checked: true, safe: true, status: 'idle' },
    { id: '2', name: '浏览器缓存', size: 0, fileCount: 0, checked: true, safe: true, status: 'idle' },
    { id: '3', name: '回收站', size: 0, fileCount: 0, checked: true, safe: true, status: 'idle' },
    { id: '4', name: 'Windows更新缓存', size: 0, fileCount: 0, checked: true, safe: true, status: 'idle' },
    { id: '5', name: '系统文件清理', size: 0, fileCount: 0, checked: true, safe: true, status: 'idle' },
    { id: '6', name: '下载目录', size: 0, fileCount: 0, checked: false, safe: false, status: 'idle' },
    { id: '7', name: '应用缓存', size: 0, fileCount: 0, checked: false, safe: false, status: 'idle' },
  ]);

  // 切换清理项选中状态
  const handleToggleItem = (id: string) => {
    setCleanItems(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // 计算可清理大小
  const getTotalCleanableSize = (): number => {
    return cleanItems
      .filter(item => item.checked)
      .reduce((sum, item) => sum + item.size, 0);
  };

  // 格式化大小
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '-- GB';
    const gb = bytes / (1024 ** 3);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 ** 2);
    return `${mb.toFixed(0)} MB`;
  };

  // 开始扫描
  const handleStartScan = async () => {
    setPageState('scanning');
    
    try {
      const items = await WailsAPI.scanCleanItems();
      setCleanItems(items);
      setPageState('scan-complete');
    } catch (error) {
      console.error('Scan failed:', error);
      setPageState('initial');
    }
  };

  // 开始清理
  const handleStartClean = async () => {
    setPageState('cleaning');
    
    try {
      await WailsAPI.cleanItems(cleanItems);
      
      // 刷新磁盘信息
      const info = await WailsAPI.getDiskInfo();
      setDiskInfo(info);
      
      setPageState('clean-complete');
    } catch (error) {
      console.error('Clean failed:', error);
      setPageState('clean-error');
    }
  };

  // 获取选中项数量
  const getCheckedCount = (): number => {
    return cleanItems.filter(item => item.checked).length;
  };

  // 渲染页面内容
  const renderContent = () => {
    switch (pageState) {
      case 'initial':
        return (
          <>
            <CleanItemList
              items={cleanItems}
              onToggle={handleToggleItem}
              onViewDetail={setSelectedItem}
            />

            <div className="mt-4 text-sm text-gray-600">
              可清理: {formatSize(getTotalCleanableSize())}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handleStartScan}
                className="btn-primary"
              >
                开始扫描
              </button>
              <button
                disabled
                className="btn-disabled"
              >
                立即清理
              </button>
            </div>

            <div className="mt-4 flex items-start gap-2 text-sm text-gray-500">
              <Lightbulb size={16} className="mt-0.5 flex-shrink-0" />
              <span>点击"开始扫描"分析可清理空间</span>
            </div>
          </>
        );

      case 'scanning':
        return (
          <>
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Search size={20} className="animate-pulse" />
              <span className="font-medium">正在扫描...</span>
            </div>

            <CleanItemList
              items={cleanItems}
              onToggle={handleToggleItem}
              onViewDetail={setSelectedItem}
              disabled
            />

            <div className="mt-4 text-sm text-gray-600">
              已扫描: {formatSize(getTotalCleanableSize())}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button className="btn-secondary">
                取消扫描
              </button>
              <button disabled className="btn-disabled">
                立即清理
              </button>
            </div>
          </>
        );

      case 'scan-complete':
        return (
          <>
            <div className="mb-4 flex items-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="font-medium">✓ 扫描完成</span>
            </div>

            <CleanItemList
              items={cleanItems}
              onToggle={handleToggleItem}
              onViewDetail={setSelectedItem}
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-600">可清理:</span>
                <span className="text-2xl font-bold text-primary">{formatSize(getTotalCleanableSize())}</span>
                <span className="text-sm text-gray-500">(已选中{getCheckedCount()}项)</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStartScan}
                  className="btn-secondary"
                >
                  重新扫描
                </button>
                <button
                  onClick={handleStartClean}
                  disabled={getTotalCleanableSize() === 0}
                  className={getTotalCleanableSize() > 0 ? 'btn-primary' : 'btn-disabled'}
                >
                  立即清理
                </button>
              </div>
            </div>
          </>
        );

      case 'cleaning':
        return (
          <>
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Trash2 size={20} className="animate-pulse" />
              <span className="font-medium">🗑️ 正在清理...</span>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <div className="mb-2">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
              <div className="text-sm text-gray-600">
                已清理: 10.6 GB / {formatSize(getTotalCleanableSize())}
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              当前: 正在清理回收站...
            </div>

            <button className="btn-danger">
              取消清理
            </button>
          </>
        );

      case 'clean-complete':
        return (
          <>
            <div className="mb-4 flex items-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="font-medium">✅ 清理完成！</span>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">成功清理:</span>
                  <span className="font-semibold text-green-600">{formatSize(getTotalCleanableSize())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">C盘剩余:</span>
                  <span className="font-semibold">217.6 GB / 300 GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">剩余空间增加:</span>
                  <span className="font-semibold text-primary">9%</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={() => setPageState('initial')}
                className="btn-secondary"
              >
                重新扫描
              </button>
              <button
                onClick={() => setPageState('initial')}
                className="btn-primary"
              >
                完成
              </button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <DiskStatus diskInfo={diskInfo} />
      {renderContent()}
      
      {/* 详情面板 */}
      {selectedItem && (
        <CleanItemDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
