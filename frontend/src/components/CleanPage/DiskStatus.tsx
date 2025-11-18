import type { DiskInfo } from '@/types';

interface DiskStatusProps {
  diskInfo: DiskInfo;
}

export default function DiskStatus({ diskInfo }: DiskStatusProps) {
  const freeGB = (diskInfo.free / (1024 ** 3)).toFixed(1);
  const totalGB = (diskInfo.total / (1024 ** 3)).toFixed(0);
  const usedPercentage = (diskInfo.used / diskInfo.total) * 100;

  // 根据使用率确定颜色（类似 Windows 系统）
  const getBarColor = () => {
    if (usedPercentage >= 90) return 'bg-red-500';      // 使用率 >= 90%: 红色（严重）
    if (usedPercentage >= 80) return 'bg-yellow-500';   // 使用率 >= 80%: 黄色（警告）
    return 'bg-blue-500';                                // 使用率 < 80%: 蓝色（正常）
  };

  // 根据使用率确定文字颜色
  const getTextColor = () => {
    if (usedPercentage >= 90) return 'text-red-600';
    if (usedPercentage >= 80) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3 text-gray-700">C盘空间</h2>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {/* 进度条 */}
          <div className="flex-1 h-6 bg-gray-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getBarColor()}`}
              style={{ width: `${usedPercentage}%` }}
            />
          </div>
          {/* 容量文字 - 显示可用空间 */}
          <span className={`text-sm font-medium whitespace-nowrap ${getTextColor()}`}>
            可用 {freeGB} GB / 共 {totalGB} GB
          </span>
        </div>
        {/* 使用率提示 */}
        {usedPercentage >= 80 && (
          <div className={`mt-2 text-xs ${getTextColor()}`}>
            {usedPercentage >= 90 
              ? '⚠️ 磁盘空间严重不足，建议立即清理' 
              : '⚠️ 磁盘空间不足，建议清理'}
          </div>
        )}
      </div>
    </div>
  );
}
