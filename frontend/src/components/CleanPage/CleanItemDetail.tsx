import { X, AlertTriangle, CheckCircle, Lock, FolderOpen } from 'lucide-react';
import type { CleanItem } from '@/types';
import WailsAPI from '@/utils/wails';

interface CleanItemDetailProps {
  item: CleanItem;
  onClose: () => void;
}

export default function CleanItemDetail({ item, onClose }: CleanItemDetailProps) {
  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 ** 3);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 ** 2);
    return `${mb.toFixed(0)} MB`;
  };

  // 打开文件夹
  const handleOpenFolder = async (path: string) => {
    try {
      await WailsAPI.openFolder(path);
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('无法打开文件夹: ' + path);
    }
  };

  // 智能识别浏览器名称
  const getBrowserName = (path: string): string => {
    if (path.includes('Google\\Chrome')) return 'Chrome';
    if (path.includes('Microsoft\\Edge')) return 'Edge';
    if (path.includes('Mozilla\\Firefox')) return 'Firefox';
    if (path.includes('BraveSoftware')) return 'Brave';
    if (path.includes('Opera')) return 'Opera';
    if (path.includes('Vivaldi')) return 'Vivaldi';
    if (path.includes('Yandex')) return 'Yandex';
    if (path.includes('360Chrome')) return '360浏览器';
    if (path.includes('QQBrowser')) return 'QQ浏览器';
    if (path.includes('SogouExplorer')) return '搜狗浏览器';
    if (path.includes('UCBrowser')) return 'UC浏览器';
    if (path.includes('Quark')) return '夸克浏览器';
    return '其他';
  };

  // 获取浏览器图标
  const getBrowserIcon = (browserName: string): string => {
    const icons: Record<string, string> = {
      'Chrome': '🔵',
      'Edge': '🔷',
      'Firefox': '🦊',
      'Brave': '🦁',
      'Opera': '🔴',
      'Vivaldi': '🎨',
      'Yandex': '🟡',
      '360浏览器': '🟢',
      'QQ浏览器': '🐧',
      '搜狗浏览器': '🔍',
      'UC浏览器': '🌐',
      '夸克浏览器': '⭐',
      '其他': '📁'
    };
    return icons[browserName] || '📁';
  };

  // 按浏览器分类路径（仅用于浏览器缓存）
  const groupPathsByBrowser = () => {
    if (item.id !== '2' || !item.paths) return null;

    const groups: Record<string, typeof item.paths> = {};

    // 按浏览器分组
    item.paths.forEach(path => {
      const browserName = getBrowserName(path.path);
      if (!groups[browserName]) {
        groups[browserName] = [];
      }
      groups[browserName].push(path);
    });

    // 排序：Chrome、Edge、Firefox 优先，其他按字母排序
    const priorityOrder = ['Chrome', 'Edge', 'Firefox', 'Brave', 'Opera', 'Vivaldi'];
    const sortedEntries = Object.entries(groups).sort(([a], [b]) => {
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b, 'zh-CN');
    });

    return sortedEntries;
  };

  // 根据清理项ID获取详细信息
  const getDetailInfo = () => {
    const configs: Record<string, { icon: string; description: string; warning: string; warningLevel: string; requireAdmin?: boolean }> = {
      '1': { icon: '📁', description: '系统和应用程序产生的临时文件，可以安全清理。', warning: '此项为安全清理项，不会影响系统正常运行。', warningLevel: 'safe' },
      '2': { icon: '🌐', description: '浏览器产生的缓存文件，包括网页缓存、Cookie等。', warning: '清理前请关闭所有浏览器，否则可能清理失败。', warningLevel: 'info' },
      '3': { icon: '🗑️', description: '清空回收站中的所有文件，释放磁盘空间。', warning: '清空后无法恢复，请确认回收站中无重要文件。', warningLevel: 'warning' },
      '4': { icon: '🔄', description: 'Windows更新下载的临时文件，已安装的更新缓存。', warning: '清理后无法回退Windows更新，建议系统稳定后清理。', warningLevel: 'warning', requireAdmin: true },
      '5': { icon: '🛠️', description: '系统运行产生的各类临时文件和缓存，可安全清理。', warning: '所有项目均可安全清理。', warningLevel: 'safe' },
      '6': { icon: '⚠️', description: '清空用户下载文件夹中的所有文件。', warning: '此操作将删除下载文件夹中的所有文件！请务必确认没有重要文件后再清理。', warningLevel: 'danger' },
      '7': { icon: '📱', description: '各类应用程序产生的缓存文件，可以安全清理。', warning: '清理后应用可能需要重新加载数据，不影响正常使用。', warningLevel: 'info' },
      '8': { icon: '📝', description: 'C盘中所有 .log 后缀的应用程序日志文件。', warning: '删除后可能影响故障排查，建议仅在确认不需要日志时清理。扫描时间可能较长。', warningLevel: 'warning' },
    };
    
    return configs[item.id] || null;
  };

  const detail = getDetailInfo();
  if (!detail) return null;

  const getWarningColor = () => {
    switch (detail.warningLevel) {
      case 'safe':
        return 'text-green-600 bg-green-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'danger':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getWarningIcon = () => {
    switch (detail.warningLevel) {
      case 'safe':
        return <CheckCircle size={16} />;
      case 'danger':
        return <AlertTriangle size={16} />;
      default:
        return <AlertTriangle size={16} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-30 animate-fade-in">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      <div className="relative w-[300px] h-full bg-white shadow-2xl animate-slide-in-right overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">{detail.icon}</span>
            <h3 className="font-semibold text-gray-800">{item.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-4">
          {/* 说明 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">清理项说明</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{detail.description}</p>
          </div>

          {/* 统计信息 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">📊 统计信息</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>• 总大小: <span className="font-semibold text-blue-600">{formatSize(item.size)}</span></div>
              {item.fileCount > 0 && <div>• 文件数: {item.fileCount.toLocaleString()} 个</div>}
              {item.paths && item.paths.length > 0 && <div>• 路径数: {item.paths.length} 个</div>}
            </div>
          </div>

          {/* 路径列表 */}
          {item.paths && item.paths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">📂 包含路径</h4>
              
              {/* 浏览器缓存：按浏览器分组显示 */}
              {item.id === '2' && groupPathsByBrowser() ? (
                <div className="space-y-4">
                  {groupPathsByBrowser()!.map(([browserName, paths]) => (
                    <div key={browserName}>
                      <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                        <span>{getBrowserIcon(browserName)}</span>
                        <span>{browserName}</span>
                        <span className="text-gray-400">
                          ({paths.reduce((sum, p) => sum + p.size, 0) / (1024 ** 2) >= 1024 
                            ? `${(paths.reduce((sum, p) => sum + p.size, 0) / (1024 ** 3)).toFixed(1)} GB`
                            : `${(paths.reduce((sum, p) => sum + p.size, 0) / (1024 ** 2)).toFixed(0)} MB`})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {paths.map((path, index) => (
                          <div 
                            key={index} 
                            className="bg-gray-50 rounded p-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer group"
                            onClick={() => handleOpenFolder(path.path)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-700 flex-1 break-all text-xs">{path.path}</div>
                              <FolderOpen className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" />
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              {formatSize(path.size)} • {path.fileCount.toLocaleString()} 个文件 • {path.folderCount.toLocaleString()} 个文件夹
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* 其他清理项：正常显示 */
                <div className="space-y-2">
                  {item.paths.map((path, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-50 rounded p-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer group"
                      onClick={() => handleOpenFolder(path.path)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-700 flex-1 break-all">{path.path}</div>
                        <FolderOpen className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" />
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {formatSize(path.size)} • {path.fileCount.toLocaleString()} 个文件 • {path.folderCount.toLocaleString()} 个文件夹
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* 权限要求 */}
          {detail.requireAdmin && (
            <div className="bg-blue-50 rounded p-3">
              <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                <Lock size={16} />
                <span>权限要求</span>
              </div>
              <p className="text-blue-600 text-xs">需要管理员权限才能清理。</p>
            </div>
          )}

          {/* 警告信息 */}
          <div className={`rounded p-3 ${getWarningColor()}`}>
            <div className="flex items-center gap-2 font-medium text-sm mb-1">
              {getWarningIcon()}
              <span>
                {detail.warningLevel === 'safe' && '安全提示'}
                {detail.warningLevel === 'info' && '注意事项'}
                {detail.warningLevel === 'warning' && '警告'}
                {detail.warningLevel === 'danger' && '危险警告'}
              </span>
            </div>
            <p className="text-xs leading-relaxed">{detail.warning}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
