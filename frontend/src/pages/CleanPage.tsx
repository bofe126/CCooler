import { useState, useEffect } from 'react';
import { Search, Lightbulb, CheckCircle, Loader2 } from 'lucide-react';
import CleanItemList from '@/components/CleanPage/CleanItemList';
import CleanItemDetail from '@/components/CleanPage/CleanItemDetail';
import WailsAPI, { type ElevatedProgress } from '@/utils/wails';
import type { CleanItem, CleanPageState } from '@/types';
import { formatSize } from '@/utils/formatters';
import { EventsOn, EventsOff } from '@/utils/wails-runtime';

interface CleanPageProps {
  isFirstVisit?: boolean;
  onCleanComplete: (size: number) => void;
  onCleanStart: () => void;
  onOptimizableSpaceUpdate?: (size: number) => void;
  onScanComplete?: () => void;
}

export default function CleanPage({ isFirstVisit = true, onCleanComplete, onCleanStart, onOptimizableSpaceUpdate, onScanComplete }: CleanPageProps) {
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

  // 首次访问时自动开始扫描
  useEffect(() => {
    if (!isFirstVisit) return;

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

      // 计算并更新可优化空间
      const totalOptimizable = getTotalCleanableSize();
      onOptimizableSpaceUpdate?.(totalOptimizable);
      
      // 通知父组件扫描完成
      onScanComplete?.();
    };
    
    autoScan();
  }, [isFirstVisit]);

  // 页面加载时立即更新可优化空间（用于显示在导航栏中）
  useEffect(() => {
    const totalOptimizable = getTotalCleanableSize();
    onOptimizableSpaceUpdate?.(totalOptimizable);
  }, [cleanItems]);

  // 页面状态
  const [pageState, setPageState] = useState<CleanPageState>('initial');

  // 详情面板
  const [selectedItem, setSelectedItem] = useState<CleanItem | null>(null);

  // 提升权限确认对话框
  const [elevateDialog, setElevateDialog] = useState<{
    isOpen: boolean;
    itemName: string;
    itemID: string;
  }>({ isOpen: false, itemName: '', itemID: '' });

  // 清理进度状态
  const [cleanProgress, setCleanProgress] = useState<ElevatedProgress | null>(null);

  // 监听清理进度事件
  useEffect(() => {
    const unsubscribe = EventsOn('clean-progress', (progress: ElevatedProgress) => {
      setCleanProgress(progress);
    });

    return () => {
      EventsOff('clean-progress');
      unsubscribe?.();
    };
  }, []);

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

  // 开始扫描 - 使用独立线程扫描每个清理项
  const handleStartScan = async () => {
    setPageState('scanning');
    
    // 清除清理提示
    onCleanStart();
    
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
    
    // 通知父组件扫描完成
    onScanComplete?.();
  };

  // 开始清理
  const handleStartClean = async () => {
    // 所有项目都使用管理员权限清理，以便强制删除被占用的文件
    const checkedItems = cleanItems.filter(item => item.checked);
    
    if (checkedItems.length === 0) {
      return;
    }

    // 弹出确认对话框
    setElevateDialog({
      isOpen: true,
      itemName: checkedItems.map(item => item.name).join('、'),
      itemID: 'all', // 清理所有选中项
    });
  };

  // 确认提升权限清理
  const handleConfirmElevate = async () => {
    setElevateDialog({ ...elevateDialog, isOpen: false });
    
    try {
      // 重置进度
      setCleanProgress(null);
      setPageState('cleaning');
      onCleanStart();
      
      // 获取所有选中的项目
      const checkedItems = cleanItems.filter(item => item.checked);
      
      console.log('清理项目:', checkedItems.map(i => `${i.id}:${i.name}`));
      
      let totalCleanedSize = 0;
      
      // 使用管理员权限清理所有项目
      for (const item of checkedItems) {
        console.log(`清理项目: ${item.id}:${item.name}`);
        
        setCleanItems(prev =>
          prev.map(i =>
            i.id === item.id ? { ...i, status: 'cleaning' } : i
          )
        );
        
        const result = await WailsAPI.cleanItemElevated(item.id);
        
        if (result.success) {
          totalCleanedSize += result.cleanedSize;
          setCleanItems(prev =>
            prev.map(i =>
              i.id === item.id
                ? { ...i, status: 'completed', size: 0, fileCount: 0 }
                : i
            )
          );
        } else {
          throw new Error(result.error);
        }
      }
      
      onCleanComplete(totalCleanedSize);
      setPageState('clean-complete');
      setCleanProgress(null);
    } catch (error: any) {
      console.error('清理失败:', error);
      
      if (error.message?.includes('UAC') || error.message?.includes('取消')) {
        alert('需要管理员权限才能清理此项，请在UAC弹窗中点击\"是\"');
      } else {
        alert(`清理失败: ${error.message}`);
      }
      
      setPageState('scan-complete');
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
        const progressPercent = cleanProgress 
          ? (cleanProgress.processedPaths / cleanProgress.totalPaths) * 100 
          : 0;
        
        return (
          <>
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Loader2 size={20} className="animate-spin" />
              <span className="font-medium">正在清理...</span>
            </div>

            {cleanProgress && (
              <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                {/* 进度条 */}
                <div className="mb-3">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300" 
                      style={{ width: `${progressPercent}%` }} 
                    />
                  </div>
                </div>

                {/* 进度信息 */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">进度:</span>
                    <span className="font-medium text-gray-900">
                      {cleanProgress.processedPaths} / {cleanProgress.totalPaths} 路径
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">已清理:</span>
                    <span className="font-medium text-primary">
                      {formatSize(cleanProgress.cleanedSize)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">文件数:</span>
                    <span className="font-medium text-gray-900">
                      {cleanProgress.cleanedCount.toLocaleString()} 个
                    </span>
                  </div>

                  {/* 当前清理路径 */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">当前路径:</div>
                    <div className="text-xs font-mono text-gray-700 break-all bg-gray-50 p-2 rounded">
                      {cleanProgress.currentPath}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!cleanProgress && (
              <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                <div className="text-sm text-gray-600">
                  正在启动清理程序...
                </div>
              </div>
            )}
          </>
        );

      case 'clean-complete':
        return (
          <>
            <div className="mb-4 flex items-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="font-medium">清理完成！</span>
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

      {/* 提升权限确认对话框 */}
      {elevateDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🛡️</span>
              <h3 className="text-lg font-semibold">需要管理员权限</h3>
            </div>
            
            <p className="text-gray-700 mb-4">
              清理 <strong>"{elevateDialog.itemName}"</strong> 需要管理员权限。
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>提示：</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>如果程序已以管理员身份运行，将直接清理</li>
                <li>否则会弹出 Windows UAC 窗口（可能在后台）</li>
                <li>请在 UAC 窗口中点击"是"以继续</li>
              </ul>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setElevateDialog({ ...elevateDialog, isOpen: false })}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleConfirmElevate}
                className="btn-primary flex items-center gap-2"
              >
                <span>🛡️</span>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
