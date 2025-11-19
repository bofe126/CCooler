import { CheckCircle, XCircle, Circle, Loader2 } from 'lucide-react';

interface CircularProgressProps {
  status: 'idle' | 'scanning' | 'scanned' | 'cleaning' | 'completed' | 'error';
  size?: number;
}

/**
 * 圆形进度组件
 * - idle: 灰色圆圈
 * - scanning/cleaning: 蓝色旋转动画
 * - scanned/completed: 绿色对勾
 * - error: 红色叉号
 */
export default function CircularProgress({ status, size = 20 }: CircularProgressProps) {
  if (status === 'scanning' || status === 'cleaning') {
    return <Loader2 className="animate-spin text-blue-500" size={size} />;
  }
  
  if (status === 'scanned' || status === 'completed') {
    return <CheckCircle className="text-green-500" size={size} />;
  }
  
  if (status === 'error') {
    return <XCircle className="text-red-500" size={size} />;
  }
  
  return <Circle className="text-gray-300" size={size} />;
}
