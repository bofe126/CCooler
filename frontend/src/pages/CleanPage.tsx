import { useState, useEffect } from 'react';
import { Search, Trash2, Lightbulb, CheckCircle } from 'lucide-react';
import CleanItemList from '@/components/CleanPage/CleanItemList';
import CleanItemDetail from '@/components/CleanPage/CleanItemDetail';
import WailsAPI from '@/utils/wails';
import type { CleanItem, CleanPageState } from '@/types';

interface CleanPageProps {
  onCleanComplete: (size: number) => void;
  onCleanStart: () => void;
}

export default function CleanPage({ onCleanComplete, onCleanStart }: CleanPageProps) {
  // 实际清理的大小
  const [cleanedSize, setCleanedSize] = useState<number>(0);

  // 自动开始扫描
  useEffect(() => {
    const autoScan = async () => {
      // 自动开始扫描 - 使用独立线程扫描每个清理项
      setPageState('scanning');
      
      // 获取所有清理项 ID
      const itemIDs = ['1', '2', '3', '4', '5', '6', '7'];
      
      // 并发扫描所有清理项
      const scanPromises = itemIDs.map(async (itemID) => {
        try {
          // 更新状态为 scanning
          setCleanItems(prev => 
            prev.map(item => 
              item.id === itemID ? { ...item, status: 'scanning' } : item
            )
          );
          
          // 调用单个清理项扫描 API
          const scannedItem = await WailsAPI.scanSingleCleanItem(itemID);
          
          // 更新扫描结果
          setCleanItems(prev => 
            prev.map(item => 
              item.id === itemID ? { ...scannedItem, checked: item.checked } : item
            )
          );
        } catch (error) {
          console.error(`Scan item ${itemID} failed:`, error);
          // 更新为错误状态
          setCleanItems(prev => 
            prev.map(item => 
              item.id === itemID ? { ...item, status: 'error' } : item
            )
          );
        }
      });
      
      // 等待所有扫描完成
      await Promise.all(scanPromises);
      setPageState('scan-complete');
    };
    
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
    { id: '6', name: '应用缓存', size: 0, fileCount: 0, checked: false, safe: false, status: 'idle' },
    { id: '7', name: '应用日志文件', size: 0, fileCount: 0, checked: false, safe: false, status: 'idle' },
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

  // 开始扫描 - 使用独立线程扫描每个清理项
  const handleStartScan = async () => {
    setPageState('scanning');
    
    // 清除清理提示
    onCleanStart();
    setCleanedSize(0);
    
    // 重置所有清理项状态
    setCleanItems(prev => 
      prev.map(item => ({ ...item, size: 0, fileCount: 0, status: 'idle' }))
    );
    
    // 获取所有清理项 ID
    const itemIDs = ['1', '2', '3', '4', '5', '6', '7'];
    
    // 并发扫描所有清理项
    const scanPromises = itemIDs.map(async (itemID) => {
      try {
        // 更新状态为 scanning
        setCleanItems(prev => 
          prev.map(item => 
            item.id === itemID ? { ...item, status: 'scanning' } : item
          )
        );
        
        // 调用单个清理项扫描 API
        const scannedItem = await WailsAPI.scanSingleCleanItem(itemID);
        
        // 更新扫描结果
        setCleanItems(prev => 
          prev.map(item => 
            item.id === itemID ? { ...scannedItem, checked: item.checked } : item
          )
        );
      } catch (error) {
        console.error(`Scan item ${itemID} failed:`, error);
        // 更新为错误状态
        setCleanItems(prev => 
          prev.map(item => 
            item.id === itemID ? { ...item, status: 'error' } : item
          )
        );
      }
    });
    
    // 等待所有扫描完成
    await Promise.all(scanPromises);
    setPageState('scan-complete');
  };

  // 开始清理
  const handleStartClean = async () => {
    // 记录清理前的大小（选中项的总大小）
    const sizeToClean = getTotalCleanableSize();
    setCleanedSize(sizeToClean);
    
    setPageState('cleaning');
    
    try {
      // 程序已经以管理员权限运行，直接清理所有文件
      await WailsAPI.cleanItems(cleanItems);
      
      // 通知父组件清理完成
      onCleanComplete(sizeToClean);
      
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

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-600">可清理:</span>
                <span className="text-2xl font-bold text-primary">{formatSize(getTotalCleanableSize())}</span>
                <span className="text-sm text-gray-500">(已选中{getCheckedCount()}项)</span>
              </div>
              
              <div className="flex items-center gap-3">
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

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-600">已扫描:</span>
                <span className="text-2xl font-bold text-primary">{formatSize(getTotalCleanableSize())}</span>
                <span className="text-sm text-gray-500">(已选中{getCheckedCount()}项)</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="btn-secondary">
                  取消扫描
                </button>
                <button disabled className="btn-disabled">
                  立即清理
                </button>
              </div>
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
                已清理: {formatSize(cleanedSize * 0.6)} / {formatSize(cleanedSize)}
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              正在清理选中的项目，请稍候...
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

            {/* 删除文件记录框 */}
            <div className="bg-white rounded-lg shadow-sm mb-4 max-h-[400px] overflow-hidden flex flex-col">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">删除记录</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-2 text-xs font-mono text-gray-600">
                  {cleanItems.filter(item => item.checked).map((item) => (
                    <div key={item.id} className="border-b border-gray-100 pb-2 last:border-0">
                      {/* 清理项名称和状态 */}
                      <div className="flex items-center gap-2 mb-1">
                        {item.status === 'completed' ? (
                          <>
                            <span className="text-green-600 font-semibold">✓</span>
                            <span className="text-green-600 font-semibold">{item.name}</span>
                            <span className="text-green-600 text-xs">(成功)</span>
                          </>
                        ) : item.status === 'error' ? (
                          <>
                            <span className="text-red-600 font-semibold">✗</span>
                            <span className="text-red-600 font-semibold">{item.name}</span>
                            <span className="text-red-600 text-xs">(失败)</span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-600 font-semibold">○</span>
                            <span className="text-gray-600 font-semibold">{item.name}</span>
                            <span className="text-gray-500 text-xs">(未清理)</span>
                          </>
                        )}
                      </div>
                      
                      {/* 路径详情 */}
                      {item.paths && item.paths.length > 0 ? (
                        item.paths.map((path, pathIndex) => (
                          <div key={pathIndex} className="ml-4 text-gray-500 truncate">
                            - {path.path} ({formatSize(path.size)})
                          </div>
                        ))
                      ) : (
                        <div className="ml-4 text-gray-500">
                          - 已清理 {formatSize(item.size)}
                        </div>
                      )}
                      
                      {/* 错误信息 */}
                      {item.error && (
                        <div className="ml-4 text-red-500 text-xs mt-1">
                          错误: {item.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setPageState('initial')}
                className="btn-primary w-full"
              >
                确定
              </button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full">
      <div className="p-6">
        {renderContent()}
      </div>
      
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
