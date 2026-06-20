import { create } from 'zustand';
import type { BookDocument, VoiceConfig, AppSettings, AudioChunk, SystemInfo } from '@/types';

interface AppState {
  // Documents
  documents: BookDocument[];
  activeDocumentId: string | null;
  setActiveDocument: (id: string | null) => void;
  addDocument: (doc: BookDocument) => void;
  updateDocument: (id: string, updates: Partial<BookDocument>) => void;
  removeDocument: (id: string) => void;

  // Voices
  voices: VoiceConfig[];
  activeVoiceId: string | null;
  setActiveVoice: (id: string) => void;
  addVoice: (voice: VoiceConfig) => void;
  removeVoice: (id: string) => void;

  // Audio / TTS Queue
  chunks: AudioChunk[];
  isPlaying: boolean;
  currentChunkIndex: number;
  audioUrl: string | null;
  currentTime: number;
  setPlaying: (playing: boolean) => void;
  setCurrentChunk: (index: number) => void;
  setAudioUrl: (url: string | null) => void;
  setCurrentTime: (time: number) => void;
  addChunk: (chunk: AudioChunk) => void;
  updateChunk: (id: string, updates: Partial<AudioChunk>) => void;
  clearChunks: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // System
  systemInfo: SystemInfo | null;
  setSystemInfo: (info: SystemInfo) => void;

  // Editor
  editorContent: string;
  setEditorContent: (content: string) => void;

  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeTab: 'editor' | 'voices' | 'settings' | 'models';
  setActiveTab: (tab: AppState['activeTab']) => void;
}

const defaultSettings: AppSettings = {
  ttsMode: 'local',
  defaultVoice: '',
  defaultSpeed: 1.0,
  defaultEmotion: 'neutral',
  modelQuant: 'q8_0',
};

export const useAppStore = create<AppState>((set) => ({
  documents: [],
  activeDocumentId: null,
  setActiveDocument: (id) => set({ activeDocumentId: id }),
  addDocument: (doc) => set((state) => ({ documents: [...state.documents, doc] })),
  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      activeDocumentId: state.activeDocumentId === id ? null : state.activeDocumentId,
    })),

  voices: [
    { id: 'default-female', name: 'Анна (стандарт)', type: 'builtin' },
    { id: 'default-male', name: 'Дмитрий (стандарт)', type: 'builtin' },
  ],
  activeVoiceId: 'default-female',
  setActiveVoice: (id) => set({ activeVoiceId: id }),
  addVoice: (voice) => set((state) => ({ voices: [...state.voices, voice] })),
  removeVoice: (id) =>
    set((state) => ({
      voices: state.voices.filter((v) => v.id !== id),
      activeVoiceId: state.activeVoiceId === id ? null : state.activeVoiceId,
    })),

  chunks: [],
  isPlaying: false,
  currentChunkIndex: 0,
  audioUrl: null,
  currentTime: 0,
  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentChunk: (index) => set({ currentChunkIndex: index }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  setCurrentTime: (time) => set({ currentTime: time }),
  addChunk: (chunk) => set((state) => ({ chunks: [...state.chunks, chunk] })),
  updateChunk: (id, updates) =>
    set((state) => ({
      chunks: state.chunks.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  clearChunks: () => set({ chunks: [], currentChunkIndex: 0, isPlaying: false }),

  settings: defaultSettings,
  updateSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),

  systemInfo: null,
  setSystemInfo: (info) => set({ systemInfo: info }),

  editorContent: '',
  setEditorContent: (content) => set({ editorContent: content }),

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  activeTab: 'editor',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));