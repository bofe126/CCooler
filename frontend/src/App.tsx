import { useState } from 'react';
import MainLayout from './components/Layout/MainLayout';
import CleanPage from './pages/CleanPage';
import DesktopPage from './pages/DesktopPage';
import SoftwarePage from './pages/SoftwarePage';
import WeChatPage from './pages/WeChatPage';
import LargeFilePage from './pages/LargeFilePage';
import OptimizePage from './pages/OptimizePage';
import type { PageType } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('clean');
  const [cleanedSize, setCleanedSize] = useState<number>(0);
  const [showCleanedTip, setShowCleanedTip] = useState<boolean>(false);

  // 可优化空间状态
  const [optimizableSpace, setOptimizableSpace] = useState<Record<PageType, number>>({
    clean: 0,
    desktop: 0,
    largefile: 0,
    optimize: 0,
    software: 0,
    wechat: 0,
  });

  // 跟踪哪些页面已经扫描过（首次访问时自动扫描，之后不再自动扫描）
  const [scannedPages, setScannedPages] = useState<Set<PageType>>(new Set());

  // 更新可优化空间
  const updateOptimizableSpace = (page: PageType, size: number) => {
    setOptimizableSpace(prev => ({
      ...prev,
      [page]: size
    }));
  };

  // 标记页面已扫描
  const markPageAsScanned = (page: PageType) => {
    setScannedPages(prev => new Set(prev).add(page));
  };

  return (
    <MainLayout 
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
      cleanedSize={cleanedSize}
      showCleanedTip={showCleanedTip}
      optimizableSpace={optimizableSpace}
    >
      {/* 所有页面始终挂载，通过 display 控制可见性，允许后台扫描继续 */}
      <div style={{ display: currentPage === 'clean' ? 'block' : 'none' }}>
        <CleanPage 
          isFirstVisit={!scannedPages.has('clean')}
          onCleanComplete={(size) => {
            setCleanedSize(size);
            setShowCleanedTip(true);
          }}
          onCleanStart={() => {
            setShowCleanedTip(false);
          }}
          onOptimizableSpaceUpdate={(size) => updateOptimizableSpace('clean', size)}
          onScanComplete={() => markPageAsScanned('clean')}
        />
      </div>
      
      <div style={{ display: currentPage === 'desktop' ? 'block' : 'none' }}>
        <DesktopPage 
          isFirstVisit={!scannedPages.has('desktop')}
          onOptimizableSpaceUpdate={(size) => updateOptimizableSpace('desktop', size)}
          onScanComplete={() => markPageAsScanned('desktop')}
        />
      </div>
      
      <div style={{ display: currentPage === 'largefile' ? 'block' : 'none' }}>
        <LargeFilePage 
          onOptimizableSpaceUpdate={(size) => updateOptimizableSpace('largefile', size)}
        />
      </div>
      
      <div style={{ display: currentPage === 'optimize' ? 'block' : 'none' }}>
        <OptimizePage 
          isFirstVisit={!scannedPages.has('optimize')}
          onOptimizableSpaceUpdate={(size) => updateOptimizableSpace('optimize', size)}
          onScanComplete={() => markPageAsScanned('optimize')}
        />
      </div>
      
      <div style={{ display: currentPage === 'software' ? 'block' : 'none' }}>
        <SoftwarePage 
          isFirstVisit={!scannedPages.has('software')}
          onOptimizableSpaceUpdate={(size) => updateOptimizableSpace('software', size)}
          onScanComplete={() => markPageAsScanned('software')}
        />
      </div>
      
      <div style={{ display: currentPage === 'wechat' ? 'block' : 'none' }}>
        <WeChatPage 
          isFirstVisit={!scannedPages.has('wechat')}
          onOptimizableSpaceUpdate={(size) => updateOptimizableSpace('wechat', size)}
          onScanComplete={() => markPageAsScanned('wechat')}
        />
      </div>
    </MainLayout>
  );
}

export default App;
