/**
 * 格式化文件大小显示
 * @param bytes 文件大小（字节）
 * @returns 格式化后的字符串，如 "1.2 GB" 或 "512 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '-- MB';

  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;

  const mb = bytes / (1024 ** 2);
  return `${mb.toFixed(0)} MB`;
}

/**
 * 格式化文件大小显示（清理页面专用）
 * @param bytes 文件大小（字节）
 * @returns 格式化后的字符串，如 "1.2 GB" 或 "512 MB"
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '-- GB';

  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;

  const mb = bytes / (1024 ** 2);
  return `${mb.toFixed(0)} MB`;
}
