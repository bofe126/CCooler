import { useState, useEffect } from 'react'
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'
import { api } from '../api/mock'

function WeChatPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [wechatData, setWechatData] = useState(null)

  useEffect(() => {
    loadWeChatInfo()
  }, [])

  const loadWeChatInfo = async () => {
    setIsLoading(true)
    try {
      const info = await api.getWeChatInfo()
      setWechatData(info)
    } catch (error) {
      console.error('Failed to load WeChat info:', error)
    }
    setIsLoading(false)
  }

  const totalSize = wechatData ? wechatData.chatSize + wechatData.fileSize + wechatData.mediaSize + wechatData.otherSize : 0

  const handleOpenWeChat = async () => {
    try {
      await api.openWeChat()
    } catch (error) {
      console.error('Failed to open WeChat:', error)
    }
  }

  const handleRescan = async () => {
    await loadWeChatInfo()
  }

  const formatSize = (gb) => {
    return `${gb.toFixed(1)} GB`
  }

  if (!wechatData || !wechatData.installed) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">微信数据迁移</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <p className="text-sm text-yellow-800 font-medium mb-1">未检测到微信</p>
            <p className="text-sm text-yellow-700">系统中未安装微信或无法检测到微信安装路径</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">微信数据迁移</h2>

      {/* WeChat Paths */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">微信安装路径:</p>
          <p className="text-sm text-gray-800 font-mono bg-gray-50 px-3 py-2 rounded">
            {wechatData.installPath}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">数据存储路径:</p>
          <p className="text-sm text-gray-800 font-mono bg-gray-50 px-3 py-2 rounded">
            {wechatData.dataPath}
          </p>
        </div>
      </div>

      {/* Data Size Breakdown */}
      <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-700">聊天记录</span>
            <span className="text-sm font-semibold text-gray-800">{formatSize(wechatData.chatSize)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-700">文件</span>
            <span className="text-sm font-semibold text-gray-800">{formatSize(wechatData.fileSize)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-700">图片/视频</span>
            <span className="text-sm font-semibold text-gray-800">{formatSize(wechatData.mediaSize)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-700">其他数据</span>
            <span className="text-sm font-semibold text-gray-800">{formatSize(wechatData.otherSize)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
            <span className="text-sm font-semibold text-gray-800">总计</span>
            <span className="text-base font-bold text-primary">{formatSize(totalSize)}</span>
          </div>
        </div>
      </div>

      {/* Migration Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">迁移步骤:</h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="font-semibold text-primary">1.</span>
            <span>点击下方按钮打开微信设置</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-primary">2.</span>
            <span>在微信中选择"设置" → "通用" → "文件管理"</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-primary">3.</span>
            <span>点击"更改"选择其他盘符（如D盘或E盘）</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-primary">4.</span>
            <span>等待微信自动迁移数据</span>
          </li>
        </ol>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleOpenWeChat}
          className="flex-1 h-12 bg-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink size={18} />
          打开微信
        </button>
        <button
          onClick={handleRescan}
          disabled={isLoading}
          className="flex-1 h-12 bg-white border-2 border-primary text-primary rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? '扫描中...' : '重新扫描'}
        </button>
      </div>
    </div>
  )
}

export default WeChatPage
