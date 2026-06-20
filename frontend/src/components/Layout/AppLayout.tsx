import { useAppStore } from '@/store/useAppStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MilkdownEditor } from '@/components/Editor/MilkdownEditor';
import { WaveformPlayer } from '@/components/AudioPlayer/WaveformPlayer';
import { VoiceSettings } from '@/components/Voice/VoiceSettings';
import { VoiceCloner } from '@/components/Voice/VoiceCloner';
import { FileImport } from '@/components/FileImport';

export function AppLayout() {
  const activeTab = useAppStore((s) => s.activeTab);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const activeDocumentId = useAppStore((s) => s.activeDocumentId);

  return (
    <div className="h-full flex flex-col bg-surface-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeTab === 'editor' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 bg-white">
                <div className="flex items-center gap-2">
                  <FileImport />
                  <span className="text-sm text-surface-500">
                    {activeDocumentId ? 'Редактирование' : 'Новый документ'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-primary">Озвучить</button>
                  <button className="btn-secondary">Экспорт</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div className="panel mx-auto max-w-3xl p-6">
                  <MilkdownEditor />
                </div>
              </div>
              <div className="border-t border-surface-200 bg-white px-4 py-3">
                <WaveformPlayer />
              </div>
            </div>
          )}
          {activeTab === 'voices' && (
            <div className="flex-1 overflow-auto p-4">
              <div className="max-w-4xl mx-auto space-y-6">
                <VoiceSettings />
                <VoiceCloner />
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-auto p-4">
              <SettingsPanel />
            </div>
          )}
          {activeTab === 'models' && (
            <div className="flex-1 overflow-auto p-4">
              <ModelsPanel />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const systemInfo = useAppStore((s) => s.systemInfo);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold">Настройки</h2>
      
      <div className="panel p-6 space-y-4">
        <h3 className="text-lg font-medium">Режим TTS</h3>
        <div className="flex gap-4">
          {(['local', 'remote', 'hybrid'] as const).map((mode) => (
            <label key={mode} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ttsMode"
                checked={settings.ttsMode === mode}
                onChange={() => updateSettings({ ttsMode: mode })}
                className="text-primary-600"
              />
              <span className="text-sm capitalize">
                {mode === 'local' && 'Локальный'}
                {mode === 'remote' && 'Удалённый'}
                {mode === 'hybrid' && 'Гибридный'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="panel p-6 space-y-4">
        <h3 className="text-lg font-medium">Система</h3>
        {systemInfo ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-surface-500">ОС</div>
            <div>{systemInfo.os}</div>
            <div className="text-surface-500">CPU ядер</div>
            <div>{systemInfo.cpuCores}</div>
            <div className="text-surface-500">RAM</div>
            <div>{systemInfo.ramGb} ГБ</div>
            <div className="text-surface-500">GPU</div>
            <div>{systemInfo.gpuName || 'Не обнаружено'}</div>
            <div className="text-surface-500">CUDA</div>
            <div>{systemInfo.hasCuda ? 'Да' : 'Нет'}</div>
          </div>
        ) : (
          <div className="text-surface-500">Загрузка...</div>
        )}
      </div>
    </div>
  );
}

function ModelsPanel() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold">Модели</h2>
      <div className="panel p-6 space-y-4">
        <h3 className="text-lg font-medium">Квантизация</h3>
        <div className="space-y-2">
          {(['q8_0', 'q4_k_m'] as const).map((q) => (
            <label key={q} className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 cursor-pointer hover:bg-surface-50">
              <input
                type="radio"
                name="quant"
                checked={settings.modelQuant === q}
                onChange={() => updateSettings({ modelQuant: q })}
              />
              <div>
                <div className="font-medium">{q === 'q8_0' ? 'Q8_0' : 'Q4_K_M'}</div>
                <div className="text-sm text-surface-500">
                  {q === 'q8_0' ? '~2.3 ГБ, максимальное качество' : '~1.5 ГБ, быстрее и компактнее'}
                </div>
              </div>
            </label>
          ))}
        </div>
        <button className="btn-primary w-full">Скачать модель</button>
      </div>
    </div>
  );
}