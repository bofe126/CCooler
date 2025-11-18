import { Trash2, BarChart3, MessageCircle } from 'lucide-react'

function Sidebar({ currentPage, onPageChange }) {
  const menuItems = [
    { id: 'clean', icon: Trash2, label: 'C盘清理' },
    { id: 'software', icon: BarChart3, label: '软件统计' },
    { id: 'wechat', icon: MessageCircle, label: '微信迁移' },
  ]

  return (
    <div className="w-[120px] bg-white border-r border-gray-200 flex flex-col">
      {menuItems.map((item) => {
        const Icon = item.icon
        const isActive = currentPage === item.id
        
        return (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`
              h-16 flex flex-col items-center justify-center gap-1 
              transition-all relative
              ${isActive 
                ? 'bg-blue-50 text-primary' 
                : 'text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            )}
            <Icon size={20} />
            <span className="text-xs">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default Sidebar
