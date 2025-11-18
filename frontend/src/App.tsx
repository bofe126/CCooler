import { useState } from 'react';
import MainLayout from './components/Layout/MainLayout';
import CleanPage from './pages/CleanPage';
import SoftwarePage from './pages/SoftwarePage';
import WeChatPage from './pages/WeChatPage';
import type { PageType } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('clean');

  const renderPage = () => {
    switch (currentPage) {
      case 'clean':
        return <CleanPage />;
      case 'software':
        return <SoftwarePage />;
      case 'wechat':
        return <WeChatPage />;
      default:
        return <CleanPage />;
    }
  };

  return (
    <MainLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </MainLayout>
  );
}

export default App;
