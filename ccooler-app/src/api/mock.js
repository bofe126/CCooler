// 模拟后端API，后续将替换为Tauri命令
import { invoke } from '@tauri-apps/api/core'

export const mockApi = {
  // 获取磁盘信息
  getDiskInfo: async () => {
    return {
      used: 195,
      total: 300,
      available: 105,
    }
  },

  // 扫描清理项
  scanCleanItems: async () => {
    // 模拟扫描延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return [
      { id: 1, name: '系统临时文件', size: 2.3, paths: ['%TEMP%', 'C:\\Windows\\Temp'] },
      { id: 2, name: '浏览器缓存', size: 1.8, paths: ['Chrome', 'Edge', 'Firefox'] },
      { id: 3, name: '回收站', size: 3.5, paths: ['RecycleBin'] },
      { id: 4, name: 'Windows更新缓存', size: 4.2, paths: ['SoftwareDistribution'] },
      { id: 5, name: '系统文件清理', size: 5.8, paths: ['WER', 'Prefetch'] },
      { id: 6, name: '下载目录', size: 3.2, paths: ['Downloads'] },
      { id: 7, name: '应用缓存', size: 0.7, paths: ['AppData\\Local\\Temp'] },
    ]
  },

  // 清理文件
  cleanFiles: async (itemIds) => {
    // 模拟清理延迟
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    return {
      success: true,
      cleanedSize: 12.5,
      cleanedCount: 2189,
    }
  },

  // 获取已安装软件列表
  getInstalledSoftware: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return [
      { name: 'Microsoft Office', path: 'C:\\Program Files\\Microsoft Office', size: 2.3 },
      { name: 'Google Chrome', path: 'C:\\Program Files\\Google\\Chrome', size: 1.2 },
      { name: 'WeChat', path: 'C:\\Program Files\\Tencent\\WeChat', size: 0.856 },
      { name: 'Adobe Reader', path: 'C:\\Program Files\\Adobe\\Reader', size: 0.645 },
      { name: 'WinRAR', path: 'C:\\Program Files\\WinRAR', size: 0.012 },
      { name: 'Visual Studio Code', path: 'C:\\Program Files\\Microsoft VS Code', size: 0.523 },
      { name: '7-Zip', path: 'C:\\Program Files\\7-Zip', size: 0.008 },
    ]
  },

  // 获取微信信息
  getWeChatInfo: async () => {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      installed: true,
      installPath: 'C:\\Program Files\\Tencent\\WeChat',
      dataPath: 'C:\\Users\\用户名\\Documents\\WeChat Files',
      chatSize: 8.5,
      fileSize: 3.2,
      mediaSize: 2.8,
      otherSize: 1.3,
    }
  },

  // 打开微信
  openWeChat: async () => {
    console.log('Opening WeChat...')
    return { success: true }
  },
}

// 检测是否在Tauri环境中
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined

export const api = {
  getDiskInfo: async () => {
    if (isTauri) {
      return await invoke('get_disk_info')
    }
    return mockApi.getDiskInfo()
  },

  scanCleanItems: async () => {
    if (isTauri) {
      return await invoke('scan_clean_items')
    }
    return mockApi.scanCleanItems()
  },

  cleanFiles: async (itemIds) => {
    if (isTauri) {
      return await invoke('clean_files', { itemIds })
    }
    return mockApi.cleanFiles(itemIds)
  },

  getInstalledSoftware: async () => {
    if (isTauri) {
      return await invoke('get_installed_software')
    }
    return mockApi.getInstalledSoftware()
  },

  getWeChatInfo: async () => {
    if (isTauri) {
      return await invoke('get_wechat_info')
    }
    return mockApi.getWeChatInfo()
  },

  openWeChat: async () => {
    if (isTauri) {
      return await invoke('open_wechat')
    }
    return mockApi.openWeChat()
  },
}
