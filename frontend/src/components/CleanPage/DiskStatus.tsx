import { useState, useEffect } from 'react';
import type { DiskInfo } from '@/types';

interface DiskStatusProps {
  diskInfo: DiskInfo;
  cleanedSize?: number; // 清理的大小（字节）
  showCleanedTip?: boolean; // 是否显示清理提示
}

export default function DiskStatus({ diskInfo, cleanedSize = 0, showCleanedTip = false }: DiskStatusProps) {
  const [animatedUsedPercentage, setAnimatedUsedPercentage] = useState((diskInfo.used / diskInfo.total) * 100);
  
  const freeGB = (diskInfo.free / (1024 ** 3)).toFixed(1);
  const totalGB = (diskInfo.total / (1024 ** 3)).toFixed(0);
  const usedPercentage = (diskInfo.used / diskInfo.total) * 100;
  const cleanedGB = (cleanedSize / (1024 ** 3)).toFixed(1);

  // 动画效果：从旧值平滑过渡到新值
  useEffect(() => {
    const startPercentage = animatedUsedPercentage;
    const endPercentage = usedPercentage;
    const duration = 1500; // 动画持续时间（毫秒）
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用 easeOutCubic 缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentPercentage = startPercentage + (endPercentage - startPercentage) * easeProgress;
      
      setAnimatedUsedPercentage(currentPercentage);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    if (Math.abs(startPercentage - endPercentage) > 0.1) {
      animate();
    } else {
      setAnimatedUsedPercentage(endPercentage);
    }
  }, [diskInfo.used, diskInfo.total]);

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
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-gray-700">C盘空间</h2>
        <span className={`text-sm font-medium ${getTextColor()}`}>
          可用 {freeGB} GB / 共 {totalGB} GB
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* 进度条 - 使用动画值 */}
        <div className="flex-1 h-4 bg-gray-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getBarColor()}`}
            style={{ width: `${animatedUsedPercentage}%` }}
          />
        </div>
        
        {/* 清理成功提示 */}
        {showCleanedTip && cleanedSize > 0 && (
          <div className="text-sm text-green-600 flex items-center gap-1 animate-fade-in whitespace-nowrap">
            <span>✅</span>
            <span>成功释放 <span className="font-semibold">{cleanedGB} GB</span></span>
          </div>
        )}
        
        {/* 使用率提示 */}
        {!showCleanedTip && usedPercentage >= 80 && (
          <div className={`text-xs ${getTextColor()} whitespace-nowrap`}>
            {usedPercentage >= 90 
              ? '⚠️ 空间严重不足' 
              : '⚠️ 空间不足'}
          </div>
        )}
      </div>
    </div>
  );
}
