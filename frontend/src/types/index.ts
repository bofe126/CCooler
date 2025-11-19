// 路径详细信息
export interface PathDetail {
  path: string;
  size: number;
  fileCount: number;
  folderCount: number;
}

// 清理项类型
export interface CleanItem {
  id: string;
  name: string;
  size: number; // 字节
  fileCount: number; // 文件总数
  checked: boolean;
  safe: boolean; // 是否为安全清理项
  status: 'idle' | 'scanning' | 'scanned' | 'cleaning' | 'completed' | 'error';
  error?: string;
  paths?: PathDetail[]; // 详细路径信息
}

// C盘清理页面状态
export type CleanPageState = 
  | 'initial'           // 初始状态
  | 'scanning'          // 扫描中
  | 'scan-complete'     // 扫描完成
  | 'cleaning'          // 清理中
  | 'clean-complete'    // 清理完成
  | 'clean-error'       // 清理错误
  | 'no-items';         // 无可清理项

// 磁盘信息
export interface DiskInfo {
  total: number;  // 总容量（字节）
  used: number;   // 已使用（字节）
  free: number;   // 剩余空间（字节）
}

// 软件信息
export interface SoftwareInfo {
  name: string;
  path: string;
  size: number; // 字节
  icon?: string; // 图标路径或base64
}

// 软件统计页面状态
export type SoftwarePageState = 
  | 'loading'           // 加载中
  | 'loaded'            // 加载完成
  | 'empty';            // 空列表

// 微信数据统计
export interface WeChatData {
  installPath: string;
  dataPath: string;
  chatSize: number;     // 聊天记录大小
  fileSize: number;     // 文件大小
  mediaSize: number;    // 图片/视频大小
  otherSize: number;    // 其他数据大小
  total: number;        // 总大小
}

// 微信迁移页面状态
export type WeChatPageState = 
  | 'not-found'         // 未检测到
  | 'scanning'          // 扫描中
  | 'normal'            // 正常
  | 'small-data'        // 数据较小
  | 'error';            // 错误

// 页面类型
export type PageType = 'clean' | 'software' | 'wechat' | 'largefile' | 'optimize';

// 大文件分类
export type LargeFileCategory = 'all' | 'download' | 'media' | 'document' | 'archive' | 'installer' | 'other';

// 大文件信息
export interface LargeFileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  category: LargeFileCategory;
  modifiedTime: string;
  extension: string;
}

// 分类统计
export interface CategoryStats {
  category: LargeFileCategory;
  totalSize: number;
  fileCount: number;
}

// 大文件页面状态
export type LargeFilePageState = 
  | 'idle'              // 初始状态
  | 'scanning'          // 扫描中
  | 'scanned'           // 扫描完成
  | 'empty'             // 未找到大文件
  | 'error';            // 错误

// 系统优化项类型
export type SystemOptimizeType = 'hibernation' | 'pagefile' | 'restore';

// 系统优化项信息
export interface SystemOptimizeItem {
  type: SystemOptimizeType;
  name: string;
  description: string;
  path: string;
  size: number;
  enabled: boolean;
  canDisable: boolean;
}

// 系统优化扫描结果
export interface SystemOptimizeResult {
  items: SystemOptimizeItem[];
  totalSize: number;
}
