import { invoke } from '@tauri-apps/api/core';
import type { BookDocument, VoiceConfig, SynthesisOptions, AppSettings, SystemInfo } from '@/types';

// Document operations
export async function importDocument(path: string): Promise<BookDocument> {
  return invoke('import_document', { path });
}

export async function saveDocument(doc: BookDocument): Promise<void> {
  return invoke('save_document', { doc });
}

// TTS operations
export async function synthesize(
  text: string,
  voiceId: string,
  options: SynthesisOptions,
  outputPath?: string
): Promise<string> {
  return invoke('synthesize', { text, voiceId, options, outputPath });
}

export async function synthesizeStream(
  text: string,
  voiceId: string,
  options: SynthesisOptions
): Promise<ReadableStream<Uint8Array>> {
  return invoke('synthesize_stream', { text, voiceId, options });
}

// Voice cloning
export async function startVoiceCloning(audioPath: string, name: string): Promise<VoiceConfig> {
  return invoke('start_voice_cloning', { audioPath, name });
}

export async function designVoice(description: string, name: string): Promise<VoiceConfig> {
  return invoke('design_voice', { description, name });
}

// Export
export async function exportAudiobook(
  format: 'mp3' | 'wav' | 'ogg' | 'm4b',
  addChapters: boolean,
  outputPath: string
): Promise<void> {
  return invoke('export_audiobook', { format, addChapters, outputPath });
}

// Settings / System
export async function switchTtsMode(mode: 'local' | 'remote' | 'hybrid'): Promise<void> {
  return invoke('switch_tts_mode', { mode });
}

export async function downloadModel(quant: 'q8_0' | 'q4_k_m'): Promise<void> {
  return invoke('download_model', { quant });
}

export async function getSystemInfo(): Promise<SystemInfo> {
  return invoke('get_system_info', {});
}

export async function getVoices(): Promise<VoiceConfig[]> {
  return invoke('get_voices', {});
}

export async function loadSettings(): Promise<AppSettings> {
  return invoke('load_settings', {});
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke('save_settings', { settings });
}