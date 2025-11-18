import { Minus, X } from 'lucide-react'
import { getCurrentWindow } from '@tauri-apps/api/window'

function TitleBar() {
  const appWindow = getCurrentWindow()

  const handleMinimize = async () => {
    await appWindow.minimize()
  }

  const handleClose = async () => {
    await appWindow.close()
  }

  return (
    <div className="h-10 bg-white border-b border-gray-200 flex items-center justify-between px-4 select-none" data-tauri-drag-region>
      <div className="text-sm font-medium text-gray-800">CCooler</div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
        >
          <Minus size={16} className="text-gray-600" />
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white rounded transition-colors"
        >
          <X size={16} className="text-gray-600" />
        </button>
      </div>
    </div>
  )
}

export default TitleBar
