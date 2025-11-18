import type { DiskInfo } from '@/types';

interface DiskStatusProps {
  diskInfo: DiskInfo;
}

export default function DiskStatus({ diskInfo }: DiskStatusProps) {
  const usedGB = (diskInfo.used / (1024 ** 3)).toFixed(0);
  const totalGB = (diskInfo.total / (1024 ** 3)).toFixed(0);
  const percentage = (diskInfo.used / diskInfo.total) * 100;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3 text-gray-700">C盘空间</h2>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {/* 进度条 */}
          <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {/* 容量文字 */}
          <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
            {usedGB} GB / {totalGB} GB
          </span>
        </div>
      </div>
    </div>
  );
}
