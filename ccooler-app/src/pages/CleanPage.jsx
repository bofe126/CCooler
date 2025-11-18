import { useState, useEffect } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { api } from '../api/mock'

function CleanPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [diskInfo, setDiskInfo] = useState({ used: 195, total: 300 })
  const [cleanItems, setCleanItems] = useState([
    { id: 1, name: '系统临时文件', size: 0, checked: true, safe: true, status: 'idle' },
    { id: 2, name: '浏览器缓存', size: 0, checked: true, safe: true, status: 'idle' },
    { id: 3, name: '回收站', size: 0, checked: true, safe: true, status: 'idle' },
    { id: 4, name: 'Windows更新缓存', size: 0, checked: true, safe: true, status: 'idle' },
    { id: 5, name: '系统文件清理', size: 0, checked: true, safe: true, status: 'idle' },
    { id: 6, name: '下载目录', size: 0, checked: false, safe: false, status: 'idle' },
    { id: 7, name: '应用缓存', size: 0, checked: false, safe: false, status: 'idle' },
  ])

  useEffect(() => {
    loadDiskInfo()
  }, [])

  const loadDiskInfo = async () => {
    try {
      const info = await api.getDiskInfo()
      setDiskInfo(info)
    } catch (error) {
      console.error('Failed to load disk info:', error)
    }
  }

  const diskUsed = diskInfo.used
  const diskTotal = diskInfo.total
  const diskPercent = Math.round((diskUsed / diskTotal) * 100)

  const totalCleanable = cleanItems
    .filter(item => item.checked)
    .reduce((sum, item) => sum + item.size, 0)

  const handleToggle = (id) => {
    setCleanItems(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    )
  }

  const handleScan = async () => {
    setIsScanning(true)
    try {
      const scannedItems = await api.scanCleanItems()
      setCleanItems(items =>
        items.map(item => {
          const scanned = scannedItems.find(s => s.id === item.id)
          return scanned ? { ...item, size: scanned.size, status: 'scanned' } : item
        })
      )
    } catch (error) {
      console.error('Failed to scan:', error)
    }
    setIsScanning(false)
  }

  const handleClean = async () => {
    const itemsToClean = cleanItems.filter(item => item.checked).map(item => item.id)
    if (itemsToClean.length === 0) return

    setIsCleaning(true)
    try {
      const result = await api.cleanFiles(itemsToClean)
      if (result.success) {
        setCleanItems(items =>
          items.map(item =>
            item.checked ? { ...item, size: 0, status: 'cleaned' } : item
          )
        )
        await loadDiskInfo()
      }
    } catch (error) {
      console.error('Failed to clean:', error)
    }
    setIsCleaning(false)
  }

  const formatSize = (gb) => {
    if (gb === 0) return '0 GB'
    return `${gb.toFixed(1)} GB`
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">C盘空间</h2>
      
      {/* Disk Usage */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${diskPercent}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">{diskPercent}%</span>
        </div>
        <p className="text-sm text-gray-600">
          已使用: {diskUsed} GB / 总容量: {diskTotal} GB
        </p>
      </div>

      {/* Clean Items */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        {cleanItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
          >
            <label className="flex items-center gap-3 flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleToggle(item.id)}
                disabled={isScanning || isCleaning}
                className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-gray-800">{item.name}</span>
            </label>
            <span className="text-sm font-medium text-gray-600 min-w-[80px] text-right">
              {isScanning && item.status === 'idle' ? '等待中...' : 
               isScanning && item.status !== 'scanned' ? '扫描中...' :
               formatSize(item.size)}
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mb-6">
        <p className="text-lg font-semibold text-gray-800">
          可清理: {formatSize(totalCleanable)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleScan}
          disabled={isScanning || isCleaning}
          className="flex-1 h-12 bg-white border-2 border-primary text-primary rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Search size={18} />
          {isScanning ? '扫描中...' : '开始扫描'}
        </button>
        <button
          onClick={handleClean}
          disabled={isScanning || isCleaning || totalCleanable === 0}
          className="flex-1 h-12 bg-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Trash2 size={18} />
          {isCleaning ? '清理中...' : '立即清理'}
        </button>
      </div>

      {/* Cleaning Progress */}
      {isCleaning && (
        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">正在清理...</p>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default CleanPage
