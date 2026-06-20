import { useCallback, useState } from 'react';
import { synthesize, synthesizeStream, exportAudiobook } from '@/api/tauri';
import { useAppStore } from '@/store/useAppStore';
import type { SynthesisOptions } from '@/types';

export function useTTS() {
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const activeVoiceId = useAppStore((s) => s.activeVoiceId);
  const settings = useAppStore((s) => s.settings);
  const addChunk = useAppStore((s) => s.addChunk);
  const updateChunk = useAppStore((s) => s.updateChunk);

  const synthesizeText = useCallback(
    async (text: string, chunkId?: string) => {
      if (!activeVoiceId) return;
      setIsSynthesizing(true);
      setProgress(0);

      const options: SynthesisOptions = {
        speed: settings.defaultSpeed,
        emotion: settings.defaultEmotion,
      };

      try {
        const id = chunkId || crypto.randomUUID();
        addChunk({ id, text, status: 'synthesizing' });
        const audioPath = await synthesize(text, activeVoiceId, options);
        updateChunk(id, { status: 'ready', audioUrl: audioPath });
        setProgress(100);
        return audioPath;
      } catch (err) {
        if (chunkId) updateChunk(chunkId, { status: 'error' });
        throw err;
      } finally {
        setIsSynthesizing(false);
      }
    },
    [activeVoiceId, settings, addChunk, updateChunk]
  );

  const synthesizeStreamText = useCallback(
    async (text: string) => {
      if (!activeVoiceId) return;
      const options: SynthesisOptions = {
        speed: settings.defaultSpeed,
        emotion: settings.defaultEmotion,
      };
      return synthesizeStream(text, activeVoiceId, options);
    },
    [activeVoiceId, settings]
  );

  const exportBook = useCallback(
    async (format: 'mp3' | 'wav' | 'ogg' | 'm4b', outputPath: string, addChapters = true) => {
      await exportAudiobook(format, addChapters, outputPath);
    },
    []
  );

  return {
    synthesizeText,
    synthesizeStreamText,
    exportBook,
    isSynthesizing,
    progress,
  };
}