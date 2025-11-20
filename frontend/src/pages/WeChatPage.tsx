import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import WailsAPI from '@/utils/wails';
import type { WeChatData, WeChatPageState } from '@/types';
import { formatSize } from '@/utils/formatters';

interface WeChatPageProps {
  onOptimizableSpaceUpdate?: (size: number) => void;
}

export default function WeChatPage({ onOptimizableSpaceUpdate }: WeChatPageProps = {}) {
  const [pageState, setPageState] = useState<WeChatPageState>('scanning');
  const [wechatData, setWechatData] = useState<WeChatData | null>(null);

  const scanWeChatData = async () => {
    setPageState('scanning');
    
    try {
      const data = await WailsAPI.detectWeChat();
      
      setWechatData(data);
      
      // 更新可优化空间（微信数据总大小）
      onOptimizableSpaceUpdate?.(data.total || 0);
      
      // 判断数据大小
      if (data.total < 1 * 1024 ** 3) {
        setPageState('small-data');
      } else {
        setPageState('normal');
      }
    } catch (error) {
      console.error('Failed to detect WeChat:', error);
      setPageState('not-found');
      onOptimizableSpaceUpdate?.(0);
    }
  };

  useEffect(() => {
    scanWeChatData();
  }, []);

  const handleOpenWeChat = async () => {
    try {
      await WailsAPI.openWeChat();
    } catch (error) {
      console.error('Failed to open WeChat:', error);
      setPageState('error');
    }
  };

  const renderContent = () => {
    switch (pageState) {
      case 'not-found':
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle size={48} className="text-yellow-500 mb-4" />
            <p className="text-gray-700 font-medium mb-2">未检测到微信</p>
            <p className="text-sm text-gray-500 mb-6">未在系统中找到微信安装</p>
            
            <div className="text-sm text-gray-600 mb-6">
              <p className="mb-2">请确保：</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>微信已正确安装</li>
                <li>微信安装在默认路径</li>
              </ul>
            </div>

            <button
              onClick={scanWeChatData}
              className="btn-primary"
            >
              重新扫描
            </button>
          </div>
        );

      case 'scanning':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">微信安装路径:</p>
              <p className="text-sm font-mono text-gray-700 mb-3">C:\Program Files\Tencent\WeChat</p>
              
              <p className="text-sm text-gray-600 mb-1">数据存储路径:</p>
              <p className="text-sm font-mono text-gray-700">C:\Users\用户名\Documents\WeChat Files</p>
            </div>

            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 size={48} className="text-primary animate-spin mb-4" />
              <p className="text-gray-600 mb-2">正在扫描微信数据...</p>
              
              <div className="w-full max-w-md mt-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">已扫描: 8.3 GB</p>
            </div>

            <button
              onClick={() => setPageState('not-found')}
              className="btn-secondary"
            >
              取消扫描
            </button>
          </div>
        );

      case 'normal':
        return wechatData ? (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">微信安装路径:</p>
              <p className="text-sm font-mono text-gray-700 mb-3">{wechatData.installPath}</p>
              
              <p className="text-sm text-gray-600 mb-1">数据存储路径:</p>
              <p className="text-sm font-mono text-gray-700">{wechatData.dataPath}</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">聊天记录</span>
                  <span className="font-medium text-gray-700">{formatSize(wechatData.chatSize)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">文件</span>
                  <span className="font-medium text-gray-700">{formatSize(wechatData.fileSize)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">图片/视频</span>
                  <span className="font-medium text-gray-700">{formatSize(wechatData.mediaSize)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">其他数据</span>
                  <span className="font-medium text-gray-700">{formatSize(wechatData.otherSize)}</span>
                </div>
                <div className="flex justify-between py-2 pt-3 border-t-2 border-gray-200">
                  <span className="font-semibold text-gray-700">总计</span>
                  <span className="font-semibold text-primary">{formatSize(wechatData.total)}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
              <p className="font-medium mb-2">迁移步骤:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>点击下方"打开微信"按钮</li>
                <li>在微信中选择"设置" → "通用" → "文件管理"</li>
                <li>点击"更改"选择其他盘符（如D盘或E盘）</li>
                <li>等待微信自动迁移数据</li>
              </ol>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleOpenWeChat}
                className="btn-primary"
              >
                打开微信
              </button>
              <button
                onClick={scanWeChatData}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw size={16} />
                重新扫描
              </button>
            </div>
          </div>
        ) : null;

      case 'small-data':
        return wechatData ? (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">微信安装路径:</p>
              <p className="text-sm font-mono text-gray-700 mb-3">{wechatData.installPath}</p>
              
              <p className="text-sm text-gray-600 mb-1">数据存储路径:</p>
              <p className="text-sm font-mono text-gray-700">{wechatData.dataPath}</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">聊天记录</span>
                  <span className="font-medium text-gray-700">{formatSize(wechatData.chatSize)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">文件</span>
                  <span className="font-medium text-gray-700">{formatSize(wechatData.fileSize)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">图片/视频</span>
                  <span className="font-medium text-gray-700">{formatSize(wechatData.mediaSize)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">其他数据</span>
                  <span className="font-medium text-gray-700">{formatSize(wechatData.otherSize)}</span>
                </div>
                <div className="flex justify-between py-2 pt-3 border-t-2 border-gray-200">
                  <span className="font-semibold text-gray-700">总计</span>
                  <span className="font-semibold text-green-600">{formatSize(wechatData.total)}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-700 mb-1">微信数据占用较小，暂无需迁移</p>
                <p className="text-gray-600">建议定期清理微信缓存以节省空间</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleOpenWeChat}
                className="btn-primary"
              >
                打开微信
              </button>
              <button
                onClick={scanWeChatData}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw size={16} />
                重新扫描
              </button>
            </div>
          </div>
        ) : null;

      case 'error':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">微信安装路径:</p>
              <p className="text-sm font-mono text-gray-700">C:\Program Files\Tencent\WeChat</p>
            </div>

            <div className="flex flex-col items-center justify-center py-10">
              <AlertTriangle size={48} className="text-red-500 mb-4" />
              <p className="text-gray-700 font-medium mb-2">无法打开微信</p>
              <p className="text-sm text-gray-500 mb-6">微信程序未响应或路径错误</p>
              
              <div className="text-sm text-gray-600 mb-6">
                <p className="mb-2">请尝试：</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>手动启动微信</li>
                  <li>检查微信是否正确安装</li>
                  <li>重新安装微信</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleOpenWeChat}
                className="btn-primary"
              >
                重试
              </button>
              <button
                onClick={scanWeChatData}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw size={16} />
                重新扫描
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">微信数据迁移</h2>
      {renderContent()}
    </div>
  );
}
