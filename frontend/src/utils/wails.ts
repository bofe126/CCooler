// Wails Runtime 绑定
// 这些函数会在 wails dev 时自动生成

declare global {
  interface Window {
    go: {
      main: {
        App: {
          GetDiskInfo(): Promise<any>;
          ScanCleanItems(): Promise<any>;
          CleanItems(items: any[]): Promise<void>;
          GetInstalledSoftware(): Promise<any>;
          DetectWeChat(): Promise<any>;
          OpenWeChat(): Promise<void>;
        };
      };
    };
  }
}

// 检查是否在 Wails 环境中运行
export const isWailsEnv = () => {
  return typeof window !== 'undefined' && window.go !== undefined;
};

// API 包装器
export const WailsAPI = {
  // 获取磁盘信息
  getDiskInfo: async () => {
    if (isWailsEnv()) {
      return await window.go.main.App.GetDiskInfo();
    }
    // 开发环境返回模拟数据
    return {
      total: 300 * 1024 ** 3,
      used: 195 * 1024 ** 3,
      free: 105 * 1024 ** 3,
    };
  },

  // 扫描清理项
  scanCleanItems: async () => {
    if (isWailsEnv()) {
      return await window.go.main.App.ScanCleanItems();
    }
    // 开发环境返回模拟数据
    return [
      { id: '1', name: '系统临时文件', size: 2.3 * 1024 ** 3, checked: true, safe: true, status: 'scanned' },
      { id: '2', name: '浏览器缓存', size: 1.8 * 1024 ** 3, checked: true, safe: true, status: 'scanned' },
      { id: '3', name: '回收站', size: 3.5 * 1024 ** 3, checked: true, safe: true, status: 'scanned' },
      { id: '4', name: 'Windows更新缓存', size: 4.2 * 1024 ** 3, checked: true, safe: true, status: 'scanned' },
      { id: '5', name: '系统文件清理', size: 5.8 * 1024 ** 3, checked: true, safe: true, status: 'scanned' },
      { id: '6', name: '下载目录', size: 3.2 * 1024 ** 3, checked: false, safe: false, status: 'scanned' },
      { id: '7', name: '应用缓存', size: 0.7 * 1024 ** 3, checked: false, safe: false, status: 'scanned' },
    ];
  },

  // 清理项目
  cleanItems: async (items: any[]) => {
    if (isWailsEnv()) {
      return await window.go.main.App.CleanItems(items);
    }
    // 开发环境模拟延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
  },

  // 获取已安装软件
  getInstalledSoftware: async () => {
    if (isWailsEnv()) {
      return await window.go.main.App.GetInstalledSoftware();
    }
    // 开发环境返回模拟数据
    return [
      { name: 'Microsoft Office', path: 'C:\\Program Files\\Microsoft Office', size: 2.3 * 1024 ** 3 },
      { name: 'Google Chrome', path: 'C:\\Program Files\\Google\\Chrome', size: 1.2 * 1024 ** 3 },
      { name: 'WeChat', path: 'C:\\Program Files\\Tencent\\WeChat', size: 856 * 1024 ** 2 },
      { name: 'Adobe Reader', path: 'C:\\Program Files\\Adobe\\Reader', size: 645 * 1024 ** 2 },
      { name: 'WinRAR', path: 'C:\\Program Files\\WinRAR', size: 12 * 1024 ** 2 },
      { name: 'Visual Studio Code', path: 'C:\\Program Files\\Microsoft VS Code', size: 423 * 1024 ** 2 },
    ];
  },

  // 检测微信
  detectWeChat: async () => {
    if (isWailsEnv()) {
      return await window.go.main.App.DetectWeChat();
    }
    // 开发环境返回模拟数据
    return {
      installPath: 'C:\\Program Files\\Tencent\\WeChat',
      dataPath: 'C:\\Users\\用户名\\Documents\\WeChat Files',
      chatSize: 8.5 * 1024 ** 3,
      fileSize: 3.2 * 1024 ** 3,
      mediaSize: 2.8 * 1024 ** 3,
      otherSize: 1.3 * 1024 ** 3,
      total: 15.8 * 1024 ** 3,
    };
  },

  // 打开微信
  openWeChat: async () => {
    if (isWailsEnv()) {
      return await window.go.main.App.OpenWeChat();
    }
    // 开发环境模拟
    console.log('Opening WeChat...');
  },
};

export default WailsAPI;
