use anyhow::Result;
use async_trait::async_trait;
use candle_core::Tensor;
use serde_json::Value;
use std::path::{Path, PathBuf};

pub mod candle;
#[cfg(all(target_os = "macos", feature = "mlx-backend"))]
pub mod mlx;

/// Common voice configuration
#[derive(Debug, Clone)]
pub struct VoiceConfig {
    pub id: String,
    pub name: String,
    pub voice_embedding: Option<Tensor>,
    pub is_cloned: bool,
}

/// Audio synthesis options
#[derive(Debug, Clone, Default)]
pub struct SynthesisOptions {
    pub speed: f32,           // 0.5 - 2.0
    pub emotion: String,      // "neutral", "happy", "sad", "angry", "whisper"
    pub language: String,     // "ru", "en", "zh", etc.
    pub pitch_shift: f32,     // -12.0 to +12.0 semitones
}

/// Abstract TTS backend trait
/// Implemented by CandleBackend (cross-platform) and MlxBackend (macOS only)
#[async_trait]
pub trait TtsBackend: Send + Sync {
    /// Initialize backend with model weights
    async fn initialize(&mut self, models_dir: &Path) -> Result<()>;

    /// Check if backend is ready
    fn is_initialized(&self) -> bool;

    /// Get backend name for logging
    fn name(&self) -> &'static str;

    /// Get device info (CPU/GPU/Metal/MLX)
    fn device_info(&self) -> String;

    /// Synthesize text to audio file, return path to WAV
    async fn synthesize(
        &mut self,
        text: &str,
        voice: &VoiceConfig,
        options: &SynthesisOptions,
        output_path: &Path,
    ) -> Result<()>;

    /// Clone voice from audio sample, return voice embedding
    async fn clone_voice(
        &mut self,
        audio_path: &Path,
    ) -> Result<Tensor>;

    /// List built-in voices available in models
    async fn list_builtin_voices(&self) -> Result<Vec<VoiceConfig>>;
}

/// Factory: select best backend for current platform
pub fn create_backend() -> Box<dyn TtsBackend> {
    #[cfg(all(target_os = "macos", feature = "mlx-backend"))]
    {
        tracing::info!("Using MLX backend for macOS Apple Silicon");
        return Box::new(mlx::MlxBackend::new());
    }

    #[cfg(not(all(target_os = "macos", feature = "mlx-backend")))]
    {
        tracing::info!("Using Candle+ONNX backend");
        return Box::new(candle::CandleBackend::new());
    }
}

/// Generate unique output path for audio file
pub fn generate_output_path() -> PathBuf {
    let cache_dir = dirs::cache_dir()
        .expect("Failed to get cache dir")
        .join("tts-app/audio");
    std::fs::create_dir_all(&cache_dir).ok();
    cache_dir.join(format!("output_{}.wav", uuid::Uuid::new_v4()))
}
