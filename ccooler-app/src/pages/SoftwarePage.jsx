import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { api } from '../api/mock'

function SoftwarePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [softwareList, setSoftwareList] = useState([])

  useEffect(() => {
    loadSoftwareList()
  }, [])

  const loadSoftwareList = async () => {
    setIsLoading(true)
    try {
      const list = await api.getInstalledSoftware()
      setSoftwareList(list)
    } catch (error) {
      console.error('Failed to load software list:', error)
    }
    setIsLoading(false)
  }

  const totalCount = softwareList.length
  const totalSize = softwareList.reduce((sum, item) => sum + item.size, 0)

  const handleRefresh = async () => {
    await loadSoftwareList()
  }

  const formatSize = (gb) => {
    if (gb < 0.1) return `${Math.round(gb * 1024)} MB`
    return `${gb.toFixed(1)} GB`
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">已安装软件</h2>

      {/* Software List */}
      <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
          <div className="col-span-4">软件名称</div>
          <div className="col-span-6">安装位置</div>
          <div className="col-span-2 text-right">大小</div>
        </div>
        
        {isLoading ? (
          <div className="px-4 py-12 text-center text-gray-500">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            <p>正在扫描...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {softwareList.map((software, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-4 text-sm text-gray-800 truncate">
                  {software.name}
                </div>
                <div className="col-span-6 text-sm text-gray-600 truncate">
                  {software.path}
                </div>
                <div className="col-span-2 text-sm text-gray-800 text-right font-medium">
                  {formatSize(software.size)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
        <p className="text-sm text-gray-600">
          总计: <span className="font-semibold text-gray-800">{totalCount}</span> 个软件，
          占用 <span className="font-semibold text-gray-800">{formatSize(totalSize)}</span>
        </p>
      </div>

      {/* Actions */}
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="h-12 px-6 bg-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        刷新列表
      </button>
    </div>
  )
}

export default SoftwarePage
