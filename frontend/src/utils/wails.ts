// Wails Runtime 绑定
// 这些函数会在 wails dev 时自动生成

declare global {
  interface Window {
    go: {
      main: {
        App: {
          GetDiskInfo(): Promise<any>;
          ScanCleanItems(): Promise<any>;
          ScanSingleCleanItem(itemID: string): Promise<any>;
          CleanItems(items: any[]): Promise<void>;
          GetInstalledSoftware(): Promise<any>;
          DetectWeChat(): Promise<any>;
          OpenWeChat(): Promise<void>;
          OpenFolder(path: string): Promise<void>;
          IsAdmin(): Promise<boolean>;
          RestartAsAdmin(): Promise<void>;
          ScanLargeFiles(): Promise<any>;
          DeleteLargeFile(path: string): Promise<void>;
          OpenLargeFileLocation(path: string): Promise<void>;
          SetLargeFileMinSize(sizeInMB: number): Promise<void>;
          ScanSystemOptimize(): Promise<any>;
          CleanSystemOptimizeItem(itemType: string): Promise<void>;
          ScanDesktop(desktopPath: string): Promise<any>;
          DeleteDesktopFile(filePath: string): Promise<void>;
          SelectFolder(): Promise<string>;
          CleanItemElevated(itemID: string): Promise<ElevatedResult>;
        };
      };
    };
  }
}

// ElevatedResult 提升权限执行结果
export interface ElevatedResult {
  success: boolean;
  error?: string;
  cleanedSize: number;
  cleanedCount: number;
}

// ElevatedProgress 提升权限执行进度
export interface ElevatedProgress {
  processedPaths: number;
  totalPaths: number;
  cleanedSize: number;
  cleanedCount: number;
  currentPath: string;
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
      { id: '6', name: '应用缓存', size: 0.7 * 1024 ** 3, checked: false, safe: false, status: 'scanned' },
      { id: '7', name: '应用日志文件', size: 1.2 * 1024 ** 3, checked: false, safe: false, status: 'scanned' },
    ];
  },

  // 扫描单个清理项
  scanSingleCleanItem: async (itemID: string) => {
    if (isWailsEnv()) {
      return await window.go.main.App.ScanSingleCleanItem(itemID);
    }
    // 开发环境模拟延迟（模拟真实扫描时间）
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // 返回模拟数据
    const mockData: Record<string, any> = {
      '1': { id: '1', name: '系统临时文件', size: 2.3 * 1024 ** 3, fileCount: 1523, checked: true, safe: true, status: 'scanned' },
      '2': { id: '2', name: '浏览器缓存', size: 1.8 * 1024 ** 3, fileCount: 8942, checked: true, safe: true, status: 'scanned' },
      '3': { id: '3', name: '回收站', size: 3.5 * 1024 ** 3, fileCount: 234, checked: true, safe: true, status: 'scanned' },
      '4': { id: '4', name: 'Windows更新缓存', size: 4.2 * 1024 ** 3, fileCount: 156, checked: true, safe: true, status: 'scanned' },
      '5': { id: '5', name: '系统文件清理', size: 5.8 * 1024 ** 3, fileCount: 3421, checked: true, safe: true, status: 'scanned' },
      '6': { id: '6', name: '应用缓存', size: 0.7 * 1024 ** 3, fileCount: 2341, checked: false, safe: false, status: 'scanned' },
      '7': { id: '7', name: '应用日志文件', size: 1.2 * 1024 ** 3, fileCount: 5623, checked: false, safe: false, status: 'scanned' },
    };
    
    return mockData[itemID] || { id: itemID, name: `清理项 ${itemID}`, size: 0, fileCount: 0, checked: false, safe: true, status: 'scanned' };
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
    // 开发环境返回模拟数据（只显示C盘软件）
    return [
      { name: 'Microsoft Office', path: 'C:\\Program Files\\Microsoft Office', size: 2.3 * 1024 ** 3 },
      { name: 'Google Chrome', path: 'C:\\Program Files\\Google\\Chrome', size: 1.2 * 1024 ** 3 },
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

  // 打开文件夹
  openFolder: async (path: string) => {
    if (isWailsEnv()) {
      return await window.go.main.App.OpenFolder(path);
    }
    // 开发环境模拟
    console.log('Opening folder:', path);
  },

  // 检查是否有管理员权限
  isAdmin: async (): Promise<boolean> => {
    if (isWailsEnv()) {
      return await window.go.main.App.IsAdmin();
    }
    // 开发环境模拟（返回 false）
    return false;
  },

  // 以管理员身份重启应用程序
  restartAsAdmin: async (): Promise<void> => {
    if (isWailsEnv()) {
      return await window.go.main.App.RestartAsAdmin();
    }
    // 开发环境模拟
    console.log('Restarting as admin...');
    alert('开发环境：模拟以管理员身份重启');
  },

  // 扫描C盘大文件
  scanLargeFiles: async () => {
    if (isWailsEnv()) {
      return await window.go.main.App.ScanLargeFiles();
    }
    // 开发环境返回模拟数据
    return {
      files: [],
      stats: [
        { category: 'all', totalSize: 0, fileCount: 0 },
        { category: 'download', totalSize: 0, fileCount: 0 },
        { category: 'video', totalSize: 0, fileCount: 0 },
        { category: 'document', totalSize: 0, fileCount: 0 },
        { category: 'other', totalSize: 0, fileCount: 0 },
      ],
      totalFiles: 0,
      totalSize: 0,
    };
  },

  // 删除大文件
  deleteLargeFile: async (path: string) => {
    if (isWailsEnv()) {
      return await window.go.main.App.DeleteLargeFile(path);
    }
    // 开发环境模拟
    console.log('Deleting file:', path);
  },

  // 打开大文件位置
  openLargeFileLocation: async (path: string) => {
    if (isWailsEnv()) {
      return await window.go.main.App.OpenLargeFileLocation(path);
    }
    // 开发环境模拟
    console.log('Opening file location:', path);
  },

  // 设置大文件最小大小
  setLargeFileMinSize: async (sizeInMB: number) => {
    if (isWailsEnv()) {
      return await window.go.main.App.SetLargeFileMinSize(sizeInMB);
    }
    // 开发环境模拟
    console.log('Setting min size:', sizeInMB, 'MB');
  },

  // 扫描系统优化项
  scanSystemOptimize: async () => {
    if (isWailsEnv()) {
      return await window.go.main.App.ScanSystemOptimize();
    }
    // 开发环境返回模拟数据
    return {
      items: [
        {
          type: 'hibernation',
          name: '系统休眠文件',
          description: '用于快速启动的休眠文件 (hiberfil.sys)，如果不使用休眠功能可以禁用',
          path: 'C:\\hiberfil.sys',
          size: 8 * 1024 ** 3, // 8GB
          enabled: true,
          canDisable: true,
        },
        {
          type: 'pagefile',
          name: '虚拟内存文件',
          description: '系统虚拟内存文件 (pagefile.sys)，建议保留以保证系统稳定运行',
          path: 'C:\\pagefile.sys',
          size: 16 * 1024 ** 3, // 16GB
          enabled: true,
          canDisable: false,
        },
        {
          type: 'restore',
          name: '系统还原点',
          description: '系统还原点占用的空间，可以清理旧的还原点释放空间',
          path: 'C:\\System Volume Information',
          size: 12 * 1024 ** 3, // 12GB
          enabled: true,
          canDisable: true,
        },
      ],
      totalSize: 36 * 1024 ** 3, // 36GB
    };
  },

  // 清理系统优化项
  cleanSystemOptimizeItem: async (itemType: string) => {
    if (isWailsEnv()) {
      return await window.go.main.App.CleanSystemOptimizeItem(itemType);
    }
    // 开发环境模拟
    console.log('Cleaning system optimize item:', itemType);
  },

  // 扫描桌面文件
  scanDesktop: async (desktopPath?: string) => {
    if (isWailsEnv()) {
      return await window.go.main.App.ScanDesktop(desktopPath || "");
    }
    // 开发环境返回模拟数据
    return [
      {
        id: '1',
        name: 'Chrome.lnk',
        path: 'C:\\Users\\Administrator\\Desktop\\Chrome.lnk',
        type: 'shortcut',
        size: 2048,
        modifiedTime: '2024-11-20 10:30:00'
      },
      {
        id: '2',
        name: 'VSCode.lnk',
        path: 'C:\\Users\\Administrator\\Desktop\\VSCode.lnk',
        type: 'shortcut',
        size: 1856,
        modifiedTime: '2024-11-19 15:20:00'
      },
      {
        id: '3',
        name: '工作报告.docx',
        path: 'C:\\Users\\Administrator\\Desktop\\工作报告.docx',
        type: 'file',
        size: 1024000,
        modifiedTime: '2024-11-18 09:15:00'
      }
    ];
  },

  // 删除桌面文件
  deleteDesktopFile: async (filePath: string) => {
    if (isWailsEnv()) {
      return await window.go.main.App.DeleteDesktopFile(filePath);
    }
    // 开发环境模拟
    console.log('Deleting desktop file:', filePath);
  },

  // 选择文件夹
  selectFolder: async () => {
    if (isWailsEnv()) {
      return await window.go.main.App.SelectFolder();
    }
    // 开发环境返回模拟路径（使用当前用户的桌面）
    return 'C:\\Users\\User\\Desktop';
  },

  // 以管理员权限清理项目
  cleanItemElevated: async (itemID: string): Promise<ElevatedResult> => {
    if (isWailsEnv()) {
      return await window.go.main.App.CleanItemElevated(itemID);
    }
    // 开发环境模拟
    return {
      success: true,
      cleanedSize: 1024 * 1024 * 100, // 100MB
      cleanedCount: 50,
    };
  },
};

export default WailsAPI;
