import { X, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import type { CleanItem } from '@/types';

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

  // 根据清理项ID获取详细信息
  const getDetailInfo = () => {
    switch (item.id) {
      case '1': // 系统临时文件
        return {
          icon: '📁',
          description: '系统和应用程序产生的临时文件，可以安全清理。',
          stats: {
            totalSize: item.size,
            fileCount: 1245,
            folderCount: 8,
          },
          paths: [
            { path: 'C:\\Users\\...\\Temp', size: item.size * 0.65, files: 823 },
            { path: 'C:\\Windows\\Temp', size: item.size * 0.35, files: 422 },
          ],
          warning: '此项为安全清理项，不会影响系统正常运行。',
          warningLevel: 'safe',
        };

      case '2': // 浏览器缓存
        return {
          icon: '🌐',
          description: '浏览器产生的缓存文件，包括网页缓存、Cookie等。',
          stats: {
            totalSize: item.size,
            browserCount: 3,
          },
          browsers: [
            { name: 'Google Chrome', icon: '🔵', cache: item.size * 0.48, cookies: item.size * 0.01 },
            { name: 'Microsoft Edge', icon: '🔷', cache: item.size * 0.35, cookies: 0 },
            { name: 'Firefox', icon: '🦊', cache: item.size * 0.16, cookies: 0 },
          ],
          warning: '清理前请关闭所有浏览器，否则可能清理失败。',
          warningLevel: 'info',
        };

      case '3': // 回收站
        return {
          icon: '🗑️',
          description: '清空回收站中的所有文件，释放磁盘空间。',
          stats: {
            totalSize: item.size,
            fileCount: 2156,
            folderCount: 89,
          },
          recentFiles: [
            { name: '报告.docx', size: 45 * 1024 ** 2, deletedDays: 3 },
            { name: '旧项目文件夹', size: 1.2 * 1024 ** 3, deletedDays: 7 },
            { name: '图片合集', size: 856 * 1024 ** 2, deletedDays: 14 },
          ],
          warning: '清空后无法恢复，请确认回收站中无重要文件。',
          warningLevel: 'warning',
        };

      case '4': // Windows更新缓存
        return {
          icon: '🔄',
          description: 'Windows更新下载的临时文件，已安装的更新缓存。',
          stats: {
            totalSize: item.size,
            updateCount: 15,
          },
          paths: [
            { path: 'SoftwareDistribution', size: item.size * 0.9, description: 'C:\\Windows\\SoftwareDistribution\\Download' },
            { path: 'Windows.old', size: item.size * 0.1, description: 'C:\\Windows.old' },
          ],
          requireAdmin: true,
          warning: '清理后无法回退Windows更新，建议系统稳定后清理。',
          warningLevel: 'warning',
        };

      case '5': // 系统文件清理
        return {
          icon: '🛠️',
          description: '系统运行产生的各类临时文件和缓存，可安全清理。',
          stats: {
            totalSize: item.size,
            categoryCount: 4,
          },
          categories: [
            { name: 'Windows错误报告', icon: '🔴', size: item.size * 0.40, description: '系统崩溃和错误日志' },
            { name: 'Defender扫描历史', icon: '🛡️', size: item.size * 0.31, description: '病毒扫描临时文件' },
            { name: '缩略图缓存', icon: '🖼️', size: item.size * 0.21, description: '图片预览缓存' },
            { name: '传递优化文件', icon: '📦', size: item.size * 0.08, description: 'Windows更新共享' },
          ],
          warning: '所有项目均可安全清理。',
          warningLevel: 'safe',
        };

      case '6': // 下载目录
        return {
          icon: '⚠️',
          description: '清空用户下载文件夹中的所有文件。',
          stats: {
            totalSize: item.size,
            fileCount: 156,
            folderCount: 12,
          },
          path: 'C:\\Users\\...\\Downloads',
          topFiles: [
            { name: '软件安装包.exe', size: 856 * 1024 ** 2, icon: '📦' },
            { name: '工作文档.pdf', size: 12 * 1024 ** 2, icon: '📄' },
            { name: '图片.jpg', size: 5 * 1024 ** 2, icon: '🖼️' },
          ],
          warning: '此操作将删除下载文件夹中的所有文件！请务必确认没有重要文件后再清理。',
          warningLevel: 'danger',
        };

      case '7': // 应用缓存
        return {
          icon: '📱',
          description: '各类应用程序产生的缓存文件，可以安全清理。',
          stats: {
            totalSize: item.size,
            appCount: 8,
          },
          apps: [
            { name: '微信缓存', icon: '💬', size: item.size * 0.37 },
            { name: '网易云音乐缓存', icon: '🎵', size: item.size * 0.27 },
            { name: '视频播放器缓存', icon: '📺', size: item.size * 0.21 },
            { name: 'Steam缓存', icon: '🎮', size: item.size * 0.11 },
          ],
          warning: '清理后应用可能需要重新加载数据，不影响正常使用。',
          warningLevel: 'info',
        };

      default:
        return null;
    }
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
              <div>• 总大小: {formatSize(detail.stats.totalSize)}</div>
              {detail.stats.fileCount && <div>• 文件数: {detail.stats.fileCount.toLocaleString()} 个</div>}
              {detail.stats.folderCount && <div>• 文件夹数: {detail.stats.folderCount} 个</div>}
              {detail.stats.browserCount && <div>• 浏览器数: {detail.stats.browserCount} 个</div>}
              {detail.stats.updateCount && <div>• 更新包数: {detail.stats.updateCount} 个</div>}
              {detail.stats.categoryCount && <div>• 项目数: {detail.stats.categoryCount} 类</div>}
              {detail.stats.appCount && <div>• 应用数: {detail.stats.appCount} 个</div>}
            </div>
          </div>

          {/* 路径列表 */}
          {detail.paths && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">📂 包含路径</h4>
              <div className="space-y-2">
                {detail.paths.map((path, index) => (
                  <div key={index} className="bg-gray-50 rounded p-2 text-sm">
                    <div className="font-medium text-gray-700">{path.path}</div>
                    <div className="text-gray-500 text-xs mt-1">
                      {formatSize(path.size)} {'files' in path && path.files && `(${path.files} 文件)`}
                      {'description' in path && path.description && <div className="mt-1">{path.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 浏览器列表 */}
          {detail.browsers && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">🌐 浏览器列表</h4>
              <div className="space-y-2">
                {detail.browsers.map((browser, index) => (
                  <div key={index} className="bg-gray-50 rounded p-2 text-sm">
                    <div className="flex items-center gap-2 font-medium text-gray-700">
                      <span>{browser.icon}</span>
                      <span>{browser.name}</span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1 space-y-0.5">
                      <div>Cache: {formatSize(browser.cache)}</div>
                      {browser.cookies > 0 && <div>Cookies: {formatSize(browser.cookies)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 最近删除的文件 */}
          {detail.recentFiles && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">📂 最近删除的文件</h4>
              <div className="space-y-2">
                {detail.recentFiles.map((file, index) => (
                  <div key={index} className="bg-gray-50 rounded p-2 text-sm">
                    <div className="font-medium text-gray-700">📄 {file.name}</div>
                    <div className="text-gray-500 text-xs mt-1 space-y-0.5">
                      <div>{formatSize(file.size)}</div>
                      <div>删除时间: {file.deletedDays}天前</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 分类列表 */}
          {detail.categories && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">📂 清理项目</h4>
              <div className="space-y-2">
                {detail.categories.map((category, index) => (
                  <div key={index} className="bg-gray-50 rounded p-2 text-sm">
                    <div className="flex items-center gap-2 font-medium text-gray-700">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1 space-y-0.5">
                      <div>{formatSize(category.size)}</div>
                      <div>{category.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 顶部文件 */}
          {detail.topFiles && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">📄 文件列表（前10项）</h4>
              <div className="space-y-2">
                {detail.topFiles.map((file, index) => (
                  <div key={index} className="bg-gray-50 rounded p-2 text-sm">
                    <div className="flex items-center gap-2 font-medium text-gray-700">
                      <span>{file.icon}</span>
                      <span>{file.name}</span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {formatSize(file.size)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 应用列表 */}
          {detail.apps && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">📂 应用列表</h4>
              <div className="space-y-2">
                {detail.apps.map((app, index) => (
                  <div key={index} className="bg-gray-50 rounded p-2 text-sm">
                    <div className="flex items-center gap-2 font-medium text-gray-700">
                      <span>{app.icon}</span>
                      <span>{app.name}</span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {formatSize(app.size)}
                    </div>
                  </div>
                ))}
              </div>
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
