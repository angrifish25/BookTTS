import { Volume2, Trash2, Mic } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function VoiceSettings() {
  const voices = useAppStore((s) => s.voices);
  const activeVoiceId = useAppStore((s) => s.activeVoiceId);
  const setActiveVoice = useAppStore((s) => s.setActiveVoice);
  const removeVoice = useAppStore((s) => s.removeVoice);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  return (
    <div className="panel p-6">
      <h3 className="text-lg font-semibold mb-4">Голоса и настройки</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">Выбор голоса</label>
          <div className="space-y-2">
            {voices.map((voice) => (
              <div
                key={voice.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  activeVoiceId === voice.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-surface-200 hover:bg-surface-50'
                }`}
                onClick={() => setActiveVoice(voice.id)}
              >
                <div className="w-10 h-10 rounded-full bg-surface-200 flex items-center justify-center shrink-0">
                  {voice.type === 'cloned' ? (
                    <Mic size={18} className="text-primary-600" />
                  ) : (
                    <Volume2 size={18} className="text-surface-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{voice.name}</div>
                  <div className="text-xs text-surface-500 capitalize">{voice.type}</div>
                </div>
                {voice.type !== 'builtin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVoice(voice.id);
                    }}
                    className="p-2 rounded-lg hover:bg-red-100 hover:text-red-600 text-surface-400"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Скорость</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.defaultSpeed}
              onChange={(e) => updateSettings({ defaultSpeed: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="text-xs text-surface-500 mt-1">{settings.defaultSpeed.toFixed(1)}x</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Эмоция</label>
            <select
              value={settings.defaultEmotion}
              onChange={(e) => updateSettings({ defaultEmotion: e.target.value as any })}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="neutral">Нейтральная</option>
              <option value="whisper">Шёпот</option>
              <option value="excited">Возбуждённая</option>
              <option value="sad">Грустная</option>
              <option value="angry">Злая</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}