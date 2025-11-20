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

  // 更新可优化空间
  const updateOptimizableSpace = (page: PageType, size: number) => {
    setOptimizableSpace(prev => ({
      ...prev,
      [page]: size
    }));
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'clean':
        return (
          <CleanPage 
            onCleanComplete={(size) => {
              setCleanedSize(size);
              setShowCleanedTip(true);
            }}
            onCleanStart={() => {
              setShowCleanedTip(false);
            }}
            onOptimizableSpaceUpdate={(size) => updateOptimizableSpace('clean', size)}
          />
        );
      case 'desktop':
        return <DesktopPage onOptimizableSpaceUpdate={(size) => updateOptimizableSpace('desktop', size)} />;
      case 'largefile':
        return <LargeFilePage onOptimizableSpaceUpdate={(size) => updateOptimizableSpace('largefile', size)} />;
      case 'optimize':
        return <OptimizePage onOptimizableSpaceUpdate={(size) => updateOptimizableSpace('optimize', size)} />;
      case 'software':
        return <SoftwarePage onOptimizableSpaceUpdate={(size) => updateOptimizableSpace('software', size)} />;
      case 'wechat':
        return <WeChatPage onOptimizableSpaceUpdate={(size) => updateOptimizableSpace('wechat', size)} />;
      default:
        return <CleanPage onCleanComplete={() => {}} onCleanStart={() => {}} />;
    }
  };

  return (
    <MainLayout 
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
      cleanedSize={cleanedSize}
      showCleanedTip={showCleanedTip}
      optimizableSpace={optimizableSpace}
    >
      {renderPage()}
    </MainLayout>
  );
}

export default App;
