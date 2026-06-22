import type { BookDocument, VoiceConfig, SynthesisOptions, AppSettings, SystemInfo } from '@/types';

const DEMO_VOICES: VoiceConfig[] = [
  { id: 'default-female', name: 'Анна (стандарт)', type: 'builtin' },
  { id: 'default-male', name: 'Дмитрий (стандарт)', type: 'builtin' },
  { id: 'demo-whisper', name: 'Шёпоток', type: 'builtin' },
  { id: 'demo-excited', name: 'Энергичный+', type: 'builtin' },
  { id: 'cloned-john', name: 'Джон (клонированный)', type: 'cloned' },
];

const DEMO_DOCS: BookDocument[] = [
  {
    id: 'demo-doc-1',
    title: 'Демонстрационная книга',
    content: 'Это пример текста для демонстрации Text-to-Speech приложения.\n\nГлава 1\n\nОднажды утром программист проснулся и обнаружил, что его IDE сама написала весь код за неделю.\n\n"Интересно," подумал он, "значит, мне осталось только написание этого демо."',
    format: 'txt',
    importedAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },
  {
    id: 'demo-doc-2',
    title: 'README проекта',
    content: '# BookTTS\n\nDesktop Text-to-Speech application based on Qwen3-TTS and Rust.\n\n## Features\n\n- Local TTS inference via Candle or MLX\n- Voice cloning support\n- Audiobook export',
    format: 'md',
    importedAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },
];

const DEMO_AUDIO_URL = 'https://cdn.jsdelivr.net/gh/exadel/compromise/samples/jfk.mp3';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function importDocument(path: string): Promise<BookDocument> {
  await delay(300);
  const ext = path.split('.').pop()?.toLowerCase() || 'txt';
  const formatMap: Record<string, BookDocument['format']> = {
    txt: 'txt', md: 'md', docx: 'docx', pdf: 'pdf', fb2: 'fb2', epub: 'epub',
  };
  const format = formatMap[ext] || 'txt';
  return DEMO_DOCS[Math.floor(Math.random() * DEMO_DOCS.length)];
}

export async function saveDocument(doc: BookDocument): Promise<void> {}

let _synthProgress = 0;
let _progressInterval: ReturnType<typeof setInterval> | null = null;

export function getSynthProgress(): number {
  return _synthProgress;
}

async function runProgress(seconds: number = 3): Promise<void> {
  _synthProgress = 0;
  return new Promise((resolve) => {
    _progressInterval = setInterval(() => {
      _synthProgress += Math.floor(Math.random() * 15) + 5;
      if (_synthProgress >= 100) {
        _synthProgress = 100;
        if (_progressInterval) clearInterval(_progressInterval);
        _progressInterval = null;
        resolve();
      }
    }, (seconds * 1000) / 8);
  });
}

export async function synthesize(
  text: string,
  voiceId: string,
  options: SynthesisOptions,
  outputPath?: string
): Promise<string> {
  console.log('[MOCK] synthesize:', { text: text.slice(0, 40), voiceId, options });
  void runProgress();
  await delay(2500);
  _synthProgress = 100;
  return DEMO_AUDIO_URL;
}

export async function synthesizeStream(
  text: string,
  voiceId: string,
  options: SynthesisOptions
): Promise<ReadableStream<Uint8Array>> {
  console.log('[MOCK] synthesizeStream:', { text: text.slice(0, 40), voiceId });
  await runProgress();
  const wavHeader = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x2a, 0x00, 0x00, 0x00, // chunk size placeholder
    0x57, 0x41, 0x56, 0x45, // "WAVE"
    0x66, 0x6d, 0x74, 0x20, // "fmt "
    0x10, 0x00, 0x00, 0x00, // fmt chunk size
    0x01, 0x00,             // PCM
    0x01, 0x00,             // mono
    0x80, 0xbb, 0x00, 0x00, // 48000 Hz
    0x00, 0xdd, 0x01, 0x00, // byte rate
    0x02, 0x00,             // block align
    0x10, 0x00,             // bits per sample
    0x64, 0x61, 0x74, 0x61, // "data"
    0x00, 0x00, 0x00, 0x00, // data length placeholder
  ]);
  return new Blob([wavHeader]).stream() as unknown as ReadableStream<Uint8Array>;
}

// ── Voice cloning ────────────────────────────────────────────────

export async function startVoiceCloning(audioPath: string, name: string): Promise<VoiceConfig> {
  console.log('[MOCK] startVoiceCloning:', { audioPath, name });
  await runProgress(4);
  return {
    id: `cloned-${generateId()}`,
    name: name || 'Клонированный голос',
    type: 'cloned',
    samplePath: audioPath,
  };
}

export async function designVoice(description: string, name: string): Promise<VoiceConfig> {
  console.log('[MOCK] designVoice:', { description, name });
  await delay(1500);
  return {
    id: `${generateId()}-designed`,
    name: name || 'Созданный голос',
    type: 'designed',
    description,
  };
}

// ── Export ───────────────────────────────────────────────────────

export async function exportAudiobook(
  format: 'mp3' | 'wav' | 'ogg' | 'm4b',
  addChapters: boolean,
  outputPath: string
): Promise<void> {
  console.log('[MOCK] exportAudiobook:', { format, addChapters, outputPath });
  await runProgress(4);
  // No-op: in demo mode we just pretend it worked
}

// ── Settings / System ───────────────────────────────────────────

export async function switchTtsMode(mode: 'local' | 'remote' | 'hybrid'): Promise<void> {
  console.log('[MOCK] switchTtsMode:', mode);
  await delay(200);
}

export async function downloadModel(quant: 'q8_0' | 'q4_k_m'): Promise<void> {
  console.log('[MOCK] downloadModel:', quant);
  await runProgress(6);
}

export async function getSystemInfo(): Promise<SystemInfo> {
  await delay(200);
  return {
    cpuCores: 10,
    ramGb: 32,
    gpuName: 'Apple M2 Pro',
    hasCuda: false,
    os: 'macOS 14.5',
  };
}

export async function getVoices(): Promise<VoiceConfig[]> {
  await delay(100);
  return DEMO_VOICES;
}

export async function loadSettings(): Promise<AppSettings> {
  await delay(50);
  return {
    ttsMode: 'local',
    defaultVoice: 'default-female',
    defaultSpeed: 1.0,
    defaultEmotion: 'neutral',
    modelQuant: 'q8_0',
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await delay(50); // no-op
}
