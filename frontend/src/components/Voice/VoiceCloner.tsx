import { useState, useRef } from 'react';
import { Mic, Square, Play, Loader2 } from 'lucide-react';
import { startVoiceCloning, designVoice } from '@/api/tauri';
import { useAppStore } from '@/store/useAppStore';

export function VoiceCloner() {
  const [mode, setMode] = useState<'clone' | 'design'>('clone');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const addVoice = useAppStore((s) => s.addVoice);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      alert('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleClone = async () => {
    if (!voiceName || !previewUrl) return;
    setIsProcessing(true);
    try {
      // In real app: save blob to temp file and pass path
      const voice = await startVoiceCloning('/tmp/recorded.wav', voiceName);
      addVoice(voice);
      setVoiceName('');
      setPreviewUrl(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDesign = async () => {
    if (!voiceName || !description) return;
    setIsProcessing(true);
    try {
      const voice = await designVoice(description, voiceName);
      addVoice(voice);
      setVoiceName('');
      setDescription('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="panel p-6">
      <h3 className="text-lg font-semibold mb-4">Клонирование и создание голоса</h3>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('clone')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            mode === 'clone' ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-700'
          }`}
        >
          Записать голос
        </button>
        <button
          onClick={() => setMode('design')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            mode === 'design' ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-700'
          }`}
        >
          Создать по описанию
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Название голоса</label>
          <input
            type="text"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            placeholder="Например: Мой голос"
            className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {mode === 'clone' ? (
          <>
            <div className="flex items-center gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  isRecording
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-surface-200 text-surface-700 hover:bg-surface-300'
                }`}
              >
                {isRecording ? <Square size={24} /> : <Mic size={24} />}
              </button>
              <div className="text-sm text-surface-600">
                {isRecording
                  ? 'Запись... нажмите стоп для остановки'
                  : 'Запишите 3-10 секунд своего голоса'}
              </div>
            </div>

            {previewUrl && (
              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                <audio src={previewUrl} controls className="flex-1 h-8" />
              </div>
            )}

            <button
              onClick={handleClone}
              disabled={!voiceName || !previewUrl || isProcessing}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Обработка...
                </>
              ) : (
                'Клонировать голос'
              )}
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Описание голоса</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Например: Глубокий мужской голос, 45 лет, с лёгким бархатным тембром"
                rows={3}
                className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <button
              onClick={handleDesign}
              disabled={!voiceName || !description || isProcessing}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать голос'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}