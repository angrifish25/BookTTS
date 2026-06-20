import { Menu, BookOpen, Mic, Settings, Database } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function Header() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const tabs = [
    { id: 'editor' as const, label: 'Редактор', icon: BookOpen },
    { id: 'voices' as const, label: 'Голоса', icon: Mic },
    { id: 'models' as const, label: 'Модели', icon: Database },
    { id: 'settings' as const, label: 'Настройки', icon: Settings },
  ];

  return (
    <header className="h-14 bg-white border-b border-surface-200 flex items-center px-4 gap-4 shrink-0">
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-surface-100 text-surface-600"
        title="Скрыть/показать боковую панель"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 mr-4">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <BookOpen size={18} className="text-white" />
        </div>
        <span className="font-semibold text-surface-900">BookTTS</span>
      </div>

      <nav className="flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}