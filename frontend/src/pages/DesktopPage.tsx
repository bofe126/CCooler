import { useState, useEffect } from 'react';
import { FolderOpen, File, Link, MapPin, RefreshCw, Sparkles } from 'lucide-react';
import type { DesktopFileInfo, DesktopFileType, DesktopPageState } from '@/types';
import { WailsAPI } from '@/utils/wails';
import ConfirmDialog from '@/components/Common/ConfirmDialog';

interface DesktopPageProps {
  onOptimizableSpaceUpdate?: (size: number) => void;
}

export default function DesktopPage({ onOptimizableSpaceUpdate }: DesktopPageProps = {}) {
  // 页面状态
  const [pageState, setPageState] = useState<DesktopPageState>('scanning');
  
  // 桌面路径
  const [desktopPath, setDesktopPath] = useState<string>('');
  
  // 文件列表
  const [files, setFiles] = useState<DesktopFileInfo[]>([]);
  
  // 选中的文件ID
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  
  // 对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // 页面加载时自动扫描
  useEffect(() => {
    handleScan();
  }, [desktopPath]);

  // 格式化大小
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = bytes / (1024 ** 2);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(2)} GB`;
  };

  // 获取文件类型图标
  const getFileIcon = (type: DesktopFileType) => {
    switch (type) {
      case 'shortcut':
        return <Link className="text-blue-600" size={20} />;
      case 'folder':
        return <FolderOpen className="text-yellow-600" size={20} />;
      case 'file':
        return <File className="text-gray-600" size={20} />;
      default:
        return <File className="text-gray-600" size={20} />;
    }
  };

  // 扫描桌面
  const handleScan = async () => {
    try {
      setPageState('scanning');
      setFiles([]);
      setSelectedFiles(new Set());
      
      // 调用后端 API 扫描桌面
      const result = await WailsAPI.scanDesktop(desktopPath);
      
      // 如果没有设置桌面路径，从结果中获取实际路径（后端返回的文件路径中提取）
      if (!desktopPath && result.length > 0) {
        const firstFilePath = result[0].path;
        const desktopDir = firstFilePath.substring(0, firstFilePath.lastIndexOf('\\'));
        setDesktopPath(desktopDir);
      } else if (!desktopPath) {
        // 如果没有文件，尝试获取默认桌面路径
        setDesktopPath('C:\\Users\\User\\Desktop');
      }
      
      setFiles(result);
      
      setPageState(result.length > 0 ? 'scanned' : 'empty');

      // 计算并更新可优化空间（桌面文件总大小）
      const totalSize = result.reduce((sum: number, f: DesktopFileInfo) => sum + f.size, 0);
      onOptimizableSpaceUpdate?.(totalSize);
    } catch (error) {
      console.error('扫描失败:', error);
      alert('扫描失败: ' + error);
      setPageState('error');
    }
  };

  // 更改桌面路径
  const handleChangePath = async () => {
    try {
      // 调用后端 API 选择文件夹
      const newPath = await WailsAPI.selectFolder();
      if (newPath) {
        setDesktopPath(newPath);
      }
    } catch (error) {
      console.error('选择路径失败:', error);
      alert('选择路径失败: ' + error);
    }
  };

  // 切换文件选中状态
  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  // 获取选中文件总大小
  const getSelectedSize = (): number => {
    return files
      .filter(file => selectedFiles.has(file.id))
      .reduce((sum, file) => sum + file.size, 0);
  };

  // 删除单个文件
  const handleDeleteFile = (file: DesktopFileInfo) => {
    setConfirmDialog({
      isOpen: true,
      title: '确认删除',
      message: `确定要删除 "${file.name}" 吗？此操作不可恢复！`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          // 调用后端 API 删除文件
          await WailsAPI.deleteDesktopFile(file.path);
          
          const remainingFiles = files.filter(f => f.id !== file.id);
          setFiles(remainingFiles);
          
          if (remainingFiles.length === 0) {
            setPageState('empty');
          }
        } catch (error) {
          console.error('删除失败:', error);
          alert('删除失败: ' + error);
        }
      }
    });
  };

  // 删除选中文件
  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;
    
    setConfirmDialog({
      isOpen: true,
      title: '确认删除',
      message: `确定要删除选中的 ${selectedFiles.size} 个项目吗？此操作不可恢复！`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          // 获取选中文件
          const filesToDelete = files.filter(file => selectedFiles.has(file.id));
          
          // 逐个删除文件
          for (const file of filesToDelete) {
            try {
              await WailsAPI.deleteDesktopFile(file.path);
            } catch (error) {
              console.error(`删除文件失败 ${file.name}:`, error);
              // 继续删除其他文件
            }
          }
          
          const remainingFiles = files.filter(file => !selectedFiles.has(file.id));
          setFiles(remainingFiles);
          setSelectedFiles(new Set());
          
          if (remainingFiles.length === 0) {
            setPageState('empty');
          }
        } catch (error) {
          console.error('删除失败:', error);
          alert('删除失败: ' + error);
        }
      }
    });
  };

  // 渲染内容
  const renderContent = () => {
    // 扫描中
    if (pageState === 'scanning') {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={48} className="text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">正在扫描桌面文件...</p>
        </div>
      );
    }

    // 桌面为空
    if (pageState === 'empty') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Sparkles size={64} className="mb-4" />
          <p className="text-lg font-medium text-gray-600">您的桌面非常整洁！</p>
          <p className="text-sm text-gray-500 mt-2">没有发现任何文件</p>
        </div>
      );
    }

    // 显示文件列表
    if (pageState === 'scanned') {
      return (
        <>
          {/* 文件列表 */}
          <div className="bg-white rounded-lg border border-gray-200">
            {/* 表头 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFiles.size === files.length && files.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">全选</span>
              </label>
              <span className="text-sm text-gray-500">共 {files.length} 项</span>
            </div>

            {/* 文件列表项 */}
            <div className="divide-y divide-gray-100">
              {files.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  {getFileIcon(file.type)}
                  <span className="flex-1 text-sm text-gray-800 truncate">{file.name}</span>
                  <span className="text-sm text-gray-500 min-w-[80px] text-right">
                    {formatSize(file.size)}
                  </span>
                  <button
                    onClick={() => handleDeleteFile(file)}
                    className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-800">桌面清理</h2>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {/* 桌面路径设置 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={18} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-700">当前桌面路径</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 truncate">
              {desktopPath || '正在获取...'}
            </div>
            <button
              onClick={handleChangePath}
              className="btn-secondary whitespace-nowrap"
            >
              更改路径
            </button>
          </div>
        </div>

        {/* 内容 */}
        {renderContent()}
      </div>

      {/* 底部操作栏 */}
      {pageState === 'scanned' && selectedFiles.size > 0 && (
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            已选中: <span className="font-semibold">{selectedFiles.size}</span> 个项目
            (<span className="font-semibold">{formatSize(getSelectedSize())}</span>)
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setSelectedFiles(new Set())}>
              取消
            </button>
            <button className="btn-danger" onClick={handleDeleteSelected}>
              删除选中
            </button>
          </div>
        </div>
      )}

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        danger={true}
      />
    </div>
  );
}
