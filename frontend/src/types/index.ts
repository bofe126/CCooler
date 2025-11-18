// 清理项类型
export interface CleanItem {
  id: string;
  name: string;
  size: number; // 字节
  checked: boolean;
  safe: boolean; // 是否为安全清理项
  status: 'idle' | 'scanning' | 'scanned' | 'cleaning' | 'completed' | 'error';
  error?: string;
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
export type PageType = 'clean' | 'software' | 'wechat';
