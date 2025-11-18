import { useState } from 'react'
import Sidebar from './components/Sidebar'
import CleanPage from './pages/CleanPage'
import SoftwarePage from './pages/SoftwarePage'
import WeChatPage from './pages/WeChatPage'
import TitleBar from './components/TitleBar'

function App() {
  const [currentPage, setCurrentPage] = useState('clean')

  const renderPage = () => {
    switch (currentPage) {
      case 'clean':
        return <CleanPage />
      case 'software':
        return <SoftwarePage />
      case 'wechat':
        return <WeChatPage />
      default:
        return <CleanPage />
    }
  }

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App
