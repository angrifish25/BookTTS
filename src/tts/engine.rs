use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;
use tracing::{info, warn};

// Platform-specific imports
#[cfg(all(target_os = "macos", feature = "mlx-backend"))]
use mlx_rs::core::{Array, Device as MlxDevice};

#[cfg(feature = "candle-backend")]
use candle_core::{Device as CandleDevice, Tensor};

/// TTS Engine that abstracts platform-specific backends.
pub struct TtsEngine {
    config: TtsConfig,
    #[cfg(all(target_os = "macos", feature = "mlx-backend"))]
    mlx_device: Option<MlxDevice>,
    #[cfg(feature = "candle-backend")]
    candle_device: Option<CandleDevice>,
    model_manager: super::model_manager::ModelManager,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TtsConfig {
    pub model_dir: String,
    pub device_preference: DevicePreference,
    pub max_seq_length: usize,
    pub sample_rate: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DevicePreference {
    Auto,
    Cpu,
    Gpu,
    Metal,   // macOS only
    Cuda,    // Windows/Linux only
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SynthesisRequest {
    pub text: String,
    pub voice_id: Option<String>,
    pub speaker_prompt: Option<String>,
    pub emotion: Option<String>,
    pub speed: f32,
    pub clone_voice_audio: Option<Vec<u8>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SynthesisResult {
    pub audio_data: Vec<u8>,
    pub sample_rate: u32,
    pub duration_ms: u32,
}

impl TtsEngine {
    pub async fn new(config: TtsConfig) -> Result<Self> {
        info!("Initializing TTS Engine...");
        info!("Platform: {}", std::env::consts::OS);
        info!("Architecture: {}", std::env::consts::ARCH);

        let model_manager = super::model_manager::ModelManager::new(&config.model_dir)?;

        #[cfg(all(target_os = "macos", feature = "mlx-backend"))]
        {
            info!("Using MLX backend for Apple Silicon");
            let device = init_mlx_device(&config.device_preference)?;
            return Ok(Self {
                config,
                mlx_device: Some(device),
                candle_device: None,
                model_manager,
            });
        }

        #[cfg(feature = "candle-backend")]
        {
            info!("Using Candle backend");
            let device = init_candle_device(&config.device_preference)?;
            return Ok(Self {
                config,
                mlx_device: None,
                candle_device: Some(device),
                model_manager,
            });
        }

        #[cfg(not(any(
            all(target_os = "macos", feature = "mlx-backend"),
            feature = "candle-backend"
        )))]
        {
            anyhow::bail!("No TTS backend enabled. Enable either 'mlx-backend' or 'candle-backend' feature.")
        }
    }

    /// Synthesize speech from text.
    pub async fn synthesize(&self, request: SynthesisRequest) -> Result<SynthesisResult> {
        info!("Synthesizing text: {}", request.text);

        // Ensure models are downloaded
        self.model_manager.ensure_models().await?;

        // Platform-specific synthesis
        #[cfg(all(target_os = "macos", feature = "mlx-backend"))]
        {
            return self.synthesize_mlx(request).await;
        }

        #[cfg(feature = "candle-backend")]
        {
            return self.synthesize_candle(request).await;
        }

        #[cfg(not(any(
            all(target_os = "macos", feature = "mlx-backend"),
            feature = "candle-backend"
        )))]
        {
            anyhow::bail!("No TTS backend enabled")
        }
    }

    /// Clone voice from audio sample.
    pub async fn clone_voice(&self, audio_data: Vec<u8>, name: String) -> Result<String> {
        info!("Cloning voice: {}", name);

        #[cfg(all(target_os = "macos", feature = "mlx-backend"))]
        {
            return self.clone_voice_mlx(audio_data, name).await;
        }

        #[cfg(feature = "candle-backend")]
        {
            return self.clone_voice_candle(audio_data, name).await;
        }

        #[cfg(not(any(
            all(target_os = "macos", feature = "mlx-backend"),
            feature = "candle-backend"
        )))]
        {
            anyhow::bail!("No TTS backend enabled")
        }
    }

    /// List available voices.
    pub fn list_voices(&self) -> Vec<VoiceInfo> {
        vec![
            VoiceInfo {
                id: "default".to_string(),
                name: "Default".to_string(),
                language: "ru".to_string(),
                gender: "neutral".to_string(),
                is_cloned: false,
            },
            VoiceInfo {
                id: "default_en".to_string(),
                name: "Default English".to_string(),
                language: "en".to_string(),
                gender: "neutral".to_string(),
                is_cloned: false,
            },
        ]
    }

    // ============== MLX Backend (macOS) ==============

    #[cfg(all(target_os = "macos", feature = "mlx-backend"))]
    async fn synthesize_mlx(&self, request: SynthesisRequest) -> Result<SynthesisResult> {
        info!("Synthesizing with MLX...");

        // TODO: Integrate with darkautism/qwen3-tts MLX implementation
        // Steps:
        // 1. Load Talker model (GGUF) via mlx-rs
        // 2. Encode text to speech tokens
        // 3. Run Predictor on MLX device
        // 4. Decode with Vocoder (ONNX)
        // 5. Return PCM audio

        // Placeholder: generate silent WAV
        let sample_rate = self.config.sample_rate;
        let duration_samples = (sample_rate as f32 * 2.0) as usize; // 2 seconds placeholder
        let audio_data = generate_placeholder_wav(sample_rate, duration_samples);

        Ok(SynthesisResult {
            audio_data,
            sample_rate,
            duration_ms: 2000,
        })
    }

    #[cfg(all(target_os = "macos", feature = "mlx-backend"))]
    async fn clone_voice_mlx(&self, _audio_data: Vec<u8>, name: String) -> Result<String> {
        info!("Cloning voice with MLX: {}", name);

        // TODO: Implement voice cloning via MLX
        // 1. Extract speaker embedding from audio
        // 2. Save as voice profile
        // 3. Return voice ID

        Ok(format!("cloned_{}", name))
    }

    // ============== Candle Backend (Windows/Linux) ==============

    #[cfg(feature = "candle-backend")]
    async fn synthesize_candle(&self, request: SynthesisRequest) -> Result<SynthesisResult> {
        info!("Synthesizing with Candle...");

        // TODO: Integrate with darkautism/qwen3-tts Candle implementation
        // Steps:
        // 1. Load Talker model (GGUF) via candle-core
        // 2. Encode text to speech tokens
        // 3. Run Predictor on Candle device (CUDA/CPU)
        // 4. Decode with Vocoder (ONNX via ort)
        // 5. Return PCM audio

        let sample_rate = self.config.sample_rate;
        let duration_samples = (sample_rate as f32 * 2.0) as usize;
        let audio_data = generate_placeholder_wav(sample_rate, duration_samples);

        Ok(SynthesisResult {
            audio_data,
            sample_rate,
            duration_ms: 2000,
        })
    }

    #[cfg(feature = "candle-backend")]
    async fn clone_voice_candle(&self, _audio_data: Vec<u8>, name: String) -> Result<String> {
        info!("Cloning voice with Candle: {}", name);

        // TODO: Implement voice cloning via Candle
        Ok(format!("cloned_{}", name))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceInfo {
    pub id: String,
    pub name: String,
    pub language: String,
    pub gender: String,
    pub is_cloned: bool,
}

// ============== Device Initialization ==============

#[cfg(all(target_os = "macos", feature = "mlx-backend"))]
fn init_mlx_device(preference: &DevicePreference) -> Result<MlxDevice> {
    match preference {
        DevicePreference::Auto | DevicePreference::Gpu | DevicePreference::Metal => {
            info!("Initializing MLX Metal device");
            Ok(MlxDevice::new())
        }
        DevicePreference::Cpu => {
            warn!("MLX CPU fallback requested (not recommended on Apple Silicon)");
            Ok(MlxDevice::cpu())
        }
        _ => {
            warn!("Invalid device preference for MLX, using Metal");
            Ok(MlxDevice::new())
        }
    }
}

#[cfg(feature = "candle-backend")]
fn init_candle_device(preference: &DevicePreference) -> Result<CandleDevice> {
    match preference {
        DevicePreference::Auto => {
            #[cfg(feature = "cuda")]
            {
                info!("Trying CUDA device...");
                if let Ok(device) = CandleDevice::new_cuda(0) {
                    return Ok(device);
                }
            }
            info!("Using CPU device");
            Ok(CandleDevice::Cpu)
        }
        DevicePreference::Gpu | DevicePreference::Cuda => {
            #[cfg(feature = "cuda")]
            {
                info!("Initializing CUDA device");
                CandleDevice::new_cuda(0).context("Failed to initialize CUDA")
            }
            #[cfg(not(feature = "cuda"))]
            {
                warn!("CUDA not available, falling back to CPU");
                Ok(CandleDevice::Cpu)
            }
        }
        DevicePreference::Cpu => {
            info!("Using CPU device");
            Ok(CandleDevice::Cpu)
        }
        DevicePreference::Metal => {
            #[cfg(target_os = "macos")]
            {
                info!("Initializing Metal device");
                CandleDevice::new_metal(0).context("Failed to initialize Metal")
            }
            #[cfg(not(target_os = "macos"))]
            {
                anyhow::bail!("Metal is only available on macOS")
            }
        }
    }
}

// ============== Helpers ==============

fn generate_placeholder_wav(sample_rate: u32, num_samples: usize) -> Vec<u8> {
    use hound::{WavSpec, WavWriter};
    use std::io::Cursor;

    let spec = WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut cursor = Cursor::new(Vec::new());
    {
        let mut writer = WavWriter::new(&mut cursor, spec).unwrap();
        for i in 0..num_samples {
            let t = i as f32 / sample_rate as f32;
            let sample = (t * 440.0 * 2.0 * std::f32::consts::PI).sin() * 0.3;
            let amplitude = i16::MAX as f32;
            writer.write_sample((sample * amplitude) as i16).unwrap();
        }
        writer.finalize().unwrap();
    }

    cursor.into_inner()
}