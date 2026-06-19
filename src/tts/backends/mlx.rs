use anyhow::{Context, Result};
use async_trait::async_trait;
use candle_core::Tensor;
use std::path::{Path, PathBuf};
use tracing::{info, warn};

use super::{SynthesisOptions, TtsBackend, VoiceConfig};
use crate::tts::model_manager::ModelManager;

/// MLX backend for macOS Apple Silicon
/// Uses Apple's MLX framework for optimal performance on M1/M2/M3/M4
/// Significantly faster than Candle+Metal for transformer inference
pub struct MlxBackend {
    model_manager: ModelManager,
    models_dir: Option<PathBuf>,
    initialized: bool,
    // TODO: MLX-specific model components
    // mlx_device: mlx_rs::Device,
    // talker: Option<mlx_qwen3_tts::Talker>,
    // predictor: Option<mlx_qwen3_tts::Predictor>,
    // vocoder: Option<mlx_qwen3_tts::Vocoder>,
}

impl MlxBackend {
    pub fn new() -> Self {
        info!("Creating MLX backend for Apple Silicon");

        // TODO: Initialize MLX device
        // let device = mlx_rs::Device::default();
        // info!("MLX device: {:?}", device);

        Self {
            model_manager: ModelManager::new(),
            models_dir: None,
            initialized: false,
        }
    }

    /// Check if running on Apple Silicon (not Intel Mac)
    pub fn is_apple_silicon() -> bool {
        #[cfg(target_arch = "aarch64")]
        {
            true
        }
        #[cfg(not(target_arch = "aarch64"))]
        {
            false
        }
    }
}

#[async_trait]
impl TtsBackend for MlxBackend {
    async fn initialize(&mut self, models_dir: &Path) -> Result<()> {
        if self.initialized {
            warn!("MlxBackend already initialized");
            return Ok(());
        }

        if !Self::is_apple_silicon() {
            anyhow::bail!("MLX backend requires Apple Silicon (M1/M2/M3/M4). Use Candle backend instead.");
        }

        info!("Initializing MLX backend with models at: {:?}", models_dir);

        // Ensure models exist or download them
        // MLX uses different weight format (safetensors or quantized MLX format)
        self.model_manager.ensure_models_mlx(models_dir).await?;

        // TODO: Load MLX-specific Qwen3-TTS components:
        // MLX models may use .safetensors or .mlx format
        // let talker_weights = models_dir.join("talker/model.safetensors");
        // let predictor_weights = models_dir.join("predictor/model.safetensors");
        // let vocoder_weights = models_dir.join("vocoder/model.safetensors");
        //
        // self.talker = Some(mlx_qwen3_tts::Talker::load(&talker_weights)?);
        // self.predictor = Some(mlx_qwen3_tts::Predictor::load(&predictor_weights)?);
        // self.vocoder = Some(mlx_qwen3_tts::Vocoder::load(&vocoder_weights)?);

        self.models_dir = Some(models_dir.to_path_buf());
        self.initialized = true;
        info!("MLX backend initialized successfully");
        Ok(())
    }

    fn is_initialized(&self) -> bool {
        self.initialized
    }

    fn name(&self) -> &'static str {
        "MLX (Apple Silicon)"
    }

    fn device_info(&self) -> String {
        "Apple Silicon MLX".to_string()
    }

    async fn synthesize(
        &mut self,
        text: &str,
        voice: &VoiceConfig,
        options: &SynthesisOptions,
        output_path: &Path,
    ) -> Result<()> {
        if !self.initialized {
            anyhow::bail!("MlxBackend not initialized");
        }

        info!(
            "Synthesizing with MLX: text_len={}, voice={}, emotion={}",
            text.len(),
            voice.name,
            options.emotion
        );

        // TODO: MLX synthesis pipeline:
        // 1. Tokenize text with Qwen tokenizer
        // 2. Talker (LLM) → semantic tokens via MLX
        //    MLX transformer inference is ~2-3x faster than Candle+Metal
        // 3. Predictor → acoustic tokens via MLX
        // 4. Vocoder → waveform via MLX
        // 5. Apply options (speed, pitch)
        // 6. Save to output_path

        // Placeholder: generate silent WAV
        self.write_placeholder_wav(output_path)?;
        Ok(())
    }

    async fn clone_voice(&mut self, audio_path: &Path) -> Result<Tensor> {
        if !self.initialized {
            anyhow::bail!("MlxBackend not initialized");
        }

        info!("Cloning voice with MLX from: {:?}", audio_path);

        // TODO:
        // 1. Load audio
        // 2. Extract voice embedding via MLX Voice Encoder (Mimi)
        // 3. Return embedding

        // Placeholder: return zero tensor (converted from MLX array)
        let device = candle_core::Device::Cpu;
        let embedding = Tensor::zeros(1, candle_core::DType::F32, &device)?;
        Ok(embedding)
    }

    async fn list_builtin_voices(&self) -> Result<Vec<VoiceConfig>> {
        // TODO: Load from models_dir/voices/
        Ok(vec![
            VoiceConfig {
                id: "default".to_string(),
                name: "Default".to_string(),
                voice_embedding: None,
                is_cloned: false,
            },
            VoiceConfig {
                id: "female_1".to_string(),
                name: "Female 1".to_string(),
                voice_embedding: None,
                is_cloned: false,
            },
        ])
    }
}

impl MlxBackend {
    fn write_placeholder_wav(&self, path: &Path) -> Result<()> {
        let spec = hound::WavSpec {
            channels: 1,
            sample_rate: 24000,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };
        let mut writer = hound::WavWriter::create(path, spec)?;
        for _ in 0..24000 {
            writer.write_sample(0i16)?;
        }
        writer.finalize()?;
        Ok(())
    }
}
