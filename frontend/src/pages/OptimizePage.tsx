import { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, HardDrive, Database, History } from 'lucide-react';
import type { SystemOptimizeItem } from '@/types';
import WailsAPI from '@/utils/wails';

export default function OptimizePage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SystemOptimizeItem[]>([]);
  const [totalSize, setTotalSize] = useState(0);

  // 格式化大小
  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 ** 3);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 ** 2);
    return `${mb.toFixed(0)} MB`;
  };

  // 获取图标
  const getIcon = (type: string) => {
    switch (type) {
      case 'hibernation':
        return <HardDrive className="text-blue-600" size={24} />;
      case 'pagefile':
        return <Database className="text-green-600" size={24} />;
      case 'restore':
        return <History className="text-orange-600" size={24} />;
      default:
        return <AlertCircle className="text-gray-600" size={24} />;
    }
  };

  // 扫描系统优化项
  const handleScan = async () => {
    try {
      setLoading(true);
      const result = await WailsAPI.scanSystemOptimize();
      setItems(result.items || []);
      setTotalSize(result.totalSize || 0);
    } catch (error) {
      console.error('扫描失败:', error);
      alert('扫描失败: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // 清理/禁用项
  const handleClean = async (item: SystemOptimizeItem) => {
    const confirmMsg = item.type === 'restore' 
      ? `确定要删除系统还原点吗？这将释放 ${formatSize(item.size)} 空间。`
      : `确定要禁用${item.name}吗？这将释放 ${formatSize(item.size)} 空间。`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await WailsAPI.cleanSystemOptimizeItem(item.type);
      alert('操作成功！');
      // 重新扫描
      handleScan();
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败: ' + error);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">设置优化</h1>
            <p className="text-sm text-gray-500 mt-1">
              管理系统休眠文件、虚拟内存和系统还原点
            </p>
          </div>
          <button
            onClick={handleScan}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? '扫描中...' : '开始扫描'}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {items.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <AlertCircle size={64} className="mb-4" />
            <p className="text-lg">点击"开始扫描"检测系统优化项</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw size={48} className="text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">正在扫描系统配置...</p>
          </div>
        )}

        {items.length > 0 && !loading && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* 总计卡片 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">可释放空间</p>
                  <p className="text-4xl font-bold">{formatSize(totalSize)}</p>
                </div>
                <div className="bg-white/20 rounded-full p-4">
                  <HardDrive size={32} />
                </div>
              </div>
            </div>

            {/* 优化项列表 */}
            {items.map((item) => (
              <div
                key={item.type}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* 图标 */}
                  <div className="flex-shrink-0 bg-gray-50 rounded-lg p-3">
                    {getIcon(item.type)}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      {item.enabled ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          已启用
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          已禁用
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📁 {item.path}</span>
                      <span>💾 {formatSize(item.size)}</span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex-shrink-0">
                    {item.canDisable && item.enabled && (
                      <button
                        onClick={() => handleClean(item)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        {item.type === 'restore' ? '清理' : '禁用'}
                      </button>
                    )}
                    {!item.enabled && (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle size={18} />
                        <span>已优化</span>
                      </div>
                    )}
                    {!item.canDisable && item.enabled && (
                      <div className="text-gray-400 text-sm">
                        不建议禁用
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
