import { useState } from 'react';
import { Search, Play, RefreshCw, FileSearch } from 'lucide-react';
import type { LargeFileCategory, LargeFileInfo, CategoryStats, LargeFilePageState } from '@/types';
import WailsAPI from '@/utils/wails';

export default function LargeFilePage() {
  // 页面状态
  const [pageState, setPageState] = useState<LargeFilePageState>('idle');
  
  // 当前选中的分类
  const [activeCategory, setActiveCategory] = useState<LargeFileCategory>('all');
  
  // 文件列表
  const [files, setFiles] = useState<LargeFileInfo[]>([]);
  
  // 选中的文件ID
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  
  // 排序和筛选
  const [sortBy, setSortBy] = useState<'size' | 'name' | 'time'>('size');
  const [filterSize, setFilterSize] = useState<'10' | '100' | '500' | '1000'>('10');
  
  // 扫描进度
  const [scanProgress, setScanProgress] = useState({ scanned: 0, found: 0 });
  
  // 分类统计数据
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([
    { category: 'all', totalSize: 0, fileCount: 0 },
    { category: 'download', totalSize: 0, fileCount: 0 },
    { category: 'media', totalSize: 0, fileCount: 0 },
    { category: 'document', totalSize: 0, fileCount: 0 },
    { category: 'archive', totalSize: 0, fileCount: 0 },
    { category: 'installer', totalSize: 0, fileCount: 0 },
    { category: 'other', totalSize: 0, fileCount: 0 },
  ]);

  // 工具函数
  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 ** 3);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 ** 2);
    return `${mb.toFixed(0)} MB`;
  };

  const getCategoryName = (category: LargeFileCategory): string => {
    const names: Record<LargeFileCategory, string> = {
      all: '全部',
      download: '下载',
      media: '影音',
      document: '文档',
      archive: '压缩包',
      installer: '安装包',
      other: '其他',
    };
    return names[category];
  };

  const getCategoryIcon = (category: LargeFileCategory): string => {
    const icons: Record<LargeFileCategory, string> = {
      all: '📊',
      download: '📥',
      media: '🎬',
      document: '📄',
      archive: '📦',
      installer: '💾',
      other: '📁',
    };
    return icons[category];
  };

  const getFileIcon = (category: LargeFileCategory): string => {
    return getCategoryIcon(category);
  };

  // 事件处理函数
  const handleStartScan = async () => {
    try {
      setPageState('scanning');
      setFiles([]);
      setSelectedFiles(new Set());
      setScanProgress({ scanned: 0, found: 0 });
      
      // 调用后端 API 扫描大文件
      const result = await WailsAPI.scanLargeFiles();
      
      if (result && result.files) {
        setFiles(result.files);
        setCategoryStats(result.stats);
        // 更新扫描结果（从 stats 中获取总数）
        const totalFiles = result.stats.find((s: any) => s.category === 'all')?.fileCount || result.files.length;
        setScanProgress({ scanned: totalFiles, found: result.files.length });
        setPageState(result.files.length > 0 ? 'scanned' : 'empty');
      } else {
        setPageState('empty');
      }
    } catch (error) {
      console.error('扫描失败:', error);
      alert('扫描失败: ' + error);
      setPageState('error');
    }
  };

  const handleCategoryChange = (category: LargeFileCategory) => {
    setActiveCategory(category);
  };

  const getFilteredFiles = (): LargeFileInfo[] => {
    // 1. 按分类筛选
    let filtered: LargeFileInfo[];
    if (activeCategory === 'all') {
      filtered = files;
    } else if (activeCategory === 'download') {
      // 下载分类：显示所有在Downloads目录中的文件
      filtered = files.filter(file => 
        file.path.toLowerCase().includes('\\downloads\\')
      );
    } else {
      // 其他分类：按文件类型筛选
      filtered = files.filter(file => file.category === activeCategory);
    }
    
    // 2. 按大小筛选
    const minSize = parseInt(filterSize) * 1024 * 1024; // MB转字节
    filtered = filtered.filter(file => file.size >= minSize);
    
    // 3. 排序
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'size':
          return b.size - a.size; // 从大到小
        case 'name':
          return a.name.localeCompare(b.name); // 字母顺序
        case 'time':
          return b.modifiedTime.localeCompare(a.modifiedTime); // 最新的在前
        default:
          return 0;
      }
    });
    
    return sorted;
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const toggleSelectAll = () => {
    const filteredFiles = getFilteredFiles();
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const getSelectedSize = (): number => {
    return files
      .filter(file => selectedFiles.has(file.id))
      .reduce((sum, file) => sum + file.size, 0);
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;
    const confirmed = window.confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？此操作不可恢复！`);
    if (confirmed) {
      try {
        // 删除选中的文件
        const filesToDelete = files.filter(file => selectedFiles.has(file.id));
        for (const file of filesToDelete) {
          await WailsAPI.deleteLargeFile(file.path);
        }
        
        // 从列表中移除已删除的文件
        const remainingFiles = files.filter(file => !selectedFiles.has(file.id));
        setFiles(remainingFiles);
        setSelectedFiles(new Set());
        
        // 重新计算统计信息
        const newStats = calculateStats(remainingFiles);
        setCategoryStats(newStats);
        
        alert(`成功删除 ${filesToDelete.length} 个文件`);
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败: ' + error);
      }
    }
  };

  // 计算统计信息
  const calculateStats = (fileList: LargeFileInfo[]): CategoryStats[] => {
    const statsMap: Record<LargeFileCategory, CategoryStats> = {
      all: { category: 'all', totalSize: 0, fileCount: 0 },
      download: { category: 'download', totalSize: 0, fileCount: 0 },
      media: { category: 'media', totalSize: 0, fileCount: 0 },
      document: { category: 'document', totalSize: 0, fileCount: 0 },
      archive: { category: 'archive', totalSize: 0, fileCount: 0 },
      installer: { category: 'installer', totalSize: 0, fileCount: 0 },
      other: { category: 'other', totalSize: 0, fileCount: 0 },
    };

    for (const file of fileList) {
      statsMap.all.totalSize += file.size;
      statsMap.all.fileCount++;
      if (statsMap[file.category]) {
        statsMap[file.category].totalSize += file.size;
        statsMap[file.category].fileCount++;
      }
    }

    return Object.values(statsMap);
  };

  // 渲染内容
  const renderContent = () => {
    if (pageState === 'idle') {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-6">
            <FileSearch size={80} className="text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-gray-500 mb-6">点击“开始扫描”查找大于 10MB 的文件</p>
        </div>
      );
    }

    if (pageState === 'scanning') {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600">扫描中</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">正在扫描大文件...</h3>
          {scanProgress.found > 0 && (
            <p className="text-gray-500 mt-2">已找到: {scanProgress.found} 个大文件</p>
          )}
        </div>
      );
    }

    const filteredFiles = getFilteredFiles();

    if (filteredFiles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">该分类下暂无文件</h3>
          <p className="text-gray-500">切换其他分类查看</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer"
            onClick={() => toggleFileSelection(file.id)}
          >
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selectedFiles.has(file.id)}
                onChange={() => toggleFileSelection(file.id)}
                className="mt-1 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">{getFileIcon(file.category)}</span>
                    <span className="text-sm font-medium text-gray-800 truncate">{file.name}</span>
                  </div>
                  <span className="text-base font-semibold text-gray-700 ml-3 flex-shrink-0">{formatSize(file.size)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-gray-500 truncate overflow-hidden flex-1 min-w-0" title={file.path}>{file.path}</div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await WailsAPI.openLargeFileLocation(file.path);
                        } catch (error) {
                          console.error('打开位置失败:', error);
                          alert('打开位置失败: ' + error);
                        }
                      }}
                    >
                      定位
                    </button>
                    <button
                      className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = window.confirm(`确定要删除文件 "${file.name}" 吗？此操作不可恢复！`);
                        if (confirmed) {
                          try {
                            await WailsAPI.deleteLargeFile(file.path);
                            const remainingFiles = files.filter(f => f.id !== file.id);
                            setFiles(remainingFiles);
                            const newStats = calculateStats(remainingFiles);
                            setCategoryStats(newStats);
                            alert('删除成功');
                          } catch (error) {
                            console.error('删除失败:', error);
                            alert('删除失败: ' + error);
                          }
                        }
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">大文件清理</h2>
        <div className="flex gap-2">
          <button 
            className={`flex items-center gap-2 ${
              pageState === 'scanning' 
                ? 'btn-disabled' 
                : 'btn-primary'
            }`}
            onClick={handleStartScan}
            disabled={pageState === 'scanning'}
          >
            {pageState === 'scanning' ? null : pageState === 'scanned' ? <RefreshCw size={16} /> : <Play size={16} />}
            {pageState === 'scanning' ? '扫描中...' : pageState === 'scanned' ? '重新扫描' : '开始扫描'}
          </button>
        </div>
      </div>

      {/* 分类标签栏 */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-0">
          {categoryStats.map((stat) => (
            <button
              key={stat.category}
              onClick={() => handleCategoryChange(stat.category)}
              className={`
                flex-1 py-4 px-4 text-center border-b-2 transition-all
                ${
                  activeCategory === stat.category
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <div className="text-2xl mb-1">{getCategoryIcon(stat.category)}</div>
              <div className="font-medium text-sm">{getCategoryName(stat.category)}</div>
              <div className="text-xs text-gray-500 mt-1">{formatSize(stat.totalSize)}</div>
              <div className="text-xs text-gray-400">{stat.fileCount} 个</div>
            </button>
          ))}
        </div>
      </div>

      {/* 工具栏 */}
      {pageState === 'scanned' && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <select 
            className="text-sm border border-gray-300 rounded px-3 py-1.5 cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'size' | 'name' | 'time')}
          >
            <option value="size">排序: 大小</option>
            <option value="name">排序: 名称</option>
            <option value="time">排序: 时间</option>
          </select>
          <select 
            className="text-sm border border-gray-300 rounded px-3 py-1.5 cursor-pointer"
            value={filterSize}
            onChange={(e) => setFilterSize(e.target.value as '10' | '100' | '500' | '1000')}
          >
            <option value="10">筛选: &gt;10MB</option>
            <option value="100">筛选: &gt;100MB</option>
            <option value="500">筛选: &gt;500MB</option>
            <option value="1000">筛选: &gt;1GB</option>
          </select>
          <div className="flex-1 flex items-center gap-2">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="搜索文件名..."
              className="flex-1 text-sm border-0 bg-transparent focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* 文件列表 */}
      <div className="flex-1 overflow-auto p-6">
        {renderContent()}
      </div>

      {/* 底部操作栏 */}
      {pageState === 'scanned' && selectedFiles.size > 0 && (
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            已选中: <span className="font-semibold">{selectedFiles.size}</span> 个文件
            (<span className="font-semibold">{formatSize(getSelectedSize())}</span>)
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={toggleSelectAll}>
              {selectedFiles.size === getFilteredFiles().length ? '取消全选' : '全选'}
            </button>
            <button className="btn-secondary" onClick={() => setSelectedFiles(new Set())}>
              取消
            </button>
            <button className="btn-danger" onClick={handleDeleteSelected}>
              删除选中
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
