import { Minus, X } from 'lucide-react';

export default function Titlebar() {
  const handleMinimize = () => {
    // TODO: 集成 Wails 后调用窗口最小化 API
    console.log('Minimize window');
  };

  const handleClose = () => {
    // TODO: 集成 Wails 后调用窗口关闭 API
    console.log('Close window');
  };

  return (
    <div className="h-8 bg-white border-b border-gray-200 flex items-center justify-between px-4 select-none">
      {/* 应用标题 */}
      <div className="text-sm font-semibold text-gray-700">
        CCooler
      </div>

      {/* 窗口控制按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleMinimize}
          className="w-8 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
          aria-label="最小化"
        >
          <Minus size={16} className="text-gray-600" />
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-6 flex items-center justify-center hover:bg-red-500 hover:text-white rounded transition-colors"
          aria-label="关闭"
        >
          <X size={16} className="text-gray-600 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
