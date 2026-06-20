export interface VoiceConfig {
  id: string;
  name: string;
  type: 'builtin' | 'cloned' | 'designed';
  samplePath?: string;
  description?: string;
}

export interface SynthesisOptions {
  speed: number;
  emotion: 'neutral' | 'whisper' | 'excited' | 'sad' | 'angry';
  pitch?: number;
}

export interface BookDocument {
  id: string;
  title: string;
  content: string;
  format: 'txt' | 'md' | 'docx' | 'pdf' | 'fb2' | 'epub';
  importedAt: string;
  lastModified: string;
}

export interface AudioChunk {
  id: string;
  text: string;
  audioUrl?: string;
  status: 'pending' | 'synthesizing' | 'ready' | 'completed' | 'error';
  duration?: number;
}

export interface AppSettings {
  ttsMode: 'local' | 'remote' | 'hybrid';
  defaultVoice: string;
  defaultSpeed: number;
  defaultEmotion: SynthesisOptions['emotion'];
  modelQuant: 'q8_0' | 'q4_k_m';
  apiEndpoint?: string;
  apiKey?: string;
}

export interface SystemInfo {
  cpuCores: number;
  ramGb: number;
  gpuName?: string;
  hasCuda: boolean;
  os: string;
}