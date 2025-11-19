import { useState } from 'react';
import MainLayout from './components/Layout/MainLayout';
import CleanPage from './pages/CleanPage';
import SoftwarePage from './pages/SoftwarePage';
import WeChatPage from './pages/WeChatPage';
import LargeFilePage from './pages/LargeFilePage';
import OptimizePage from './pages/OptimizePage';
import type { PageType } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('clean');
  const [cleanedSize, setCleanedSize] = useState<number>(0);
  const [showCleanedTip, setShowCleanedTip] = useState<boolean>(false);

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
          />
        );
      case 'largefile':
        return <LargeFilePage />;
      case 'optimize':
        return <OptimizePage />;
      case 'software':
        return <SoftwarePage />;
      case 'wechat':
        return <WeChatPage />;
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
    >
      {renderPage()}
    </MainLayout>
  );
}

export default App;
