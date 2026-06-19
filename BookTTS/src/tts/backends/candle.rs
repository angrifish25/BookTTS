use anyhow::{Context, Result};
use async_trait::async_trait;
use candle_core::{Device, Tensor};
use std::path::{Path, PathBuf};
use tracing::{info, warn};

use super::{generate_output_path, SynthesisOptions, TtsBackend, VoiceConfig};
use crate::tts::model_manager::ModelManager;

/// Candle + ONNX Runtime backend
/// Works on: Windows (CPU/CUDA), Linux (CPU/CUDA), macOS (CPU/Metal fallback)
pub struct CandleBackend {
    device: Device,
    model_manager: ModelManager,
    models_dir: Option<PathBuf>,
    initialized: bool,
    // TODO: Actual model components from darkautism/qwen3-tts
    // talker: Option<qwen3_tts::Talker>,
    // predictor: Option<qwen3_tts::Predictor>,
    // vocoder: Option<ort::Session>,
}

impl CandleBackend {
    pub fn new() -> Self {
        let device = Self::detect_device();
        info!("CandleBackend created with device: {:?}", device);

        Self {
            device,
            model_manager: ModelManager::new(),
            models_dir: None,
            initialized: false,
        }
    }

    fn detect_device() -> Device {
        #[cfg(target_os = "macos")]
        {
            if candle_core::utils::metal_is_available() {
                info!("Metal detected, using Metal backend");
                return Device::new_metal(0).unwrap_or(Device::Cpu);
            }
        }

        #[cfg(not(target_os = "macos"))]
        {
            if candle_core::utils::cuda_is_available() {
                info!("CUDA detected, using CUDA backend");
                return Device::new_cuda(0).unwrap_or(Device::Cpu);
            }
        }

        info!("No GPU detected, using CPU");
        Device::Cpu
    }
}

#[async_trait]
impl TtsBackend for CandleBackend {
    async fn initialize(&mut self, models_dir: &Path) -> Result<()> {
        if self.initialized {
            warn!("CandleBackend already initialized");
            return Ok(());
        }

        info!("Initializing CandleBackend with models at: {:?}", models_dir);

        // Ensure models exist or download them
        self.model_manager.ensure_models(models_dir).await?;

        // TODO: Load actual Qwen3-TTS components:
        // let talker_weights = models_dir.join("talker/model.gguf");
        // let predictor_weights = models_dir.join("predictor/model.gguf");
        // let vocoder_model = models_dir.join("vocoder/vocoder.onnx");
        //
        // self.talker = Some(qwen3_tts::Talker::load(&talker_weights, &self.device)?);
        // self.predictor = Some(qwen3_tts::Predictor::load(&predictor_weights, &self.device)?);
        // self.vocoder = Some(ort::Session::builder()?.commit_from_file(vocoder_model)?);

        self.models_dir = Some(models_dir.to_path_buf());
        self.initialized = true;
        info!("CandleBackend initialized successfully");
        Ok(())
    }

    fn is_initialized(&self) -> bool {
        self.initialized
    }

    fn name(&self) -> &'static str {
        "Candle+ONNX"
    }

    fn device_info(&self) -> String {
        format!("{:?}", self.device)
    }

    async fn synthesize(
        &mut self,
        text: &str,
        voice: &VoiceConfig,
        options: &SynthesisOptions,
        output_path: &Path,
    ) -> Result<()> {
        if !self.initialized {
            anyhow::bail!("CandleBackend not initialized");
        }

        info!(
            "Synthesizing with Candle: text_len={}, voice={}, emotion={}",
            text.len(),
            voice.name,
            options.emotion
        );

        // TODO: Real synthesis pipeline:
        // 1. Tokenize text with Qwen tokenizer
        // 2. Talker (LLM) → semantic tokens via Candle
        // 3. Predictor → acoustic tokens via Candle
        // 4. Vocoder (ONNX) → waveform
        // 5. Apply options (speed, pitch) via rubato
        // 6. Save to output_path

        // Placeholder: generate silent WAV
        self.write_placeholder_wav(output_path)?;
        Ok(())
    }

    async fn clone_voice(&mut self, audio_path: &Path) -> Result<Tensor> {
        if !self.initialized {
            anyhow::bail!("CandleBackend not initialized");
        }

        info!("Cloning voice from: {:?}", audio_path);

        // TODO:
        // 1. Load audio via symphonia/hound
        // 2. Extract voice embedding via Voice Encoder (Mimi via Candle)
        // 3. Return embedding tensor

        // Placeholder: return zero tensor
        let embedding = Tensor::zeros(1, candle_core::DType::F32, &self.device)?;
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

impl CandleBackend {
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
