use anyhow::Result;
use std::path::{Path, PathBuf};
use tracing::{info, warn};

/// Manages Qwen3-TTS model files
pub struct ModelManager {
    models_dir: PathBuf,
}

impl ModelManager {
    pub fn new(models_dir: &str) -> Result<Self> {
        let path = PathBuf::from(models_dir);
        std::fs::create_dir_all(&path)?;
        Ok(Self { models_dir: path })
    }

    /// Ensure all required model files exist, download if missing
    pub async fn ensure_models(&self) -> Result<()> {
        #[cfg(all(target_os = "macos", feature = "mlx-backend"))]
        {
            self.ensure_models_mlx().await
        }

        #[cfg(feature = "candle-backend")]
        {
            self.ensure_models_candle().await
        }

        #[cfg(not(any(
            all(target_os = "macos", feature = "mlx-backend"),
            feature = "candle-backend"
        )))]
        {
            Ok(())
        }
    }

    /// Ensure Candle/GGUF model files exist
    #[cfg(feature = "candle-backend")]
    async fn ensure_models_candle(&self) -> Result<()> {
        let required_files = vec![
            ("talker/model.gguf", "https://huggingface.co/darkautism/qwen3-tts/resolve/main/talker/model.gguf"),
            ("predictor/model.gguf", "https://huggingface.co/darkautism/qwen3-tts/resolve/main/predictor/model.gguf"),
            ("vocoder/vocoder.onnx", "https://huggingface.co/darkautism/qwen3-tts/resolve/main/vocoder/vocoder.onnx"),
            ("tokenizer/tokenizer.json", "https://huggingface.co/darkautism/qwen3-tts/resolve/main/tokenizer/tokenizer.json"),
        ];

        for (relative_path, url) in required_files {
            let file_path = self.models_dir.join(relative_path);
            if !file_path.exists() {
                info!("Downloading model file: {} -> {:?}", url, file_path);
                std::fs::create_dir_all(file_path.parent().unwrap())?;
                self.download_file(url, &file_path).await?;
            } else {
                info!("Model file already exists: {:?}", file_path);
            }
        }

        Ok(())
    }

    /// Ensure MLX model files exist
    #[cfg(all(target_os = "macos", feature = "mlx-backend"))]
    async fn ensure_models_mlx(&self) -> Result<()> {
        let required_files = vec![
            ("talker/model.safetensors", "https://huggingface.co/mlx-community/Qwen3-TTS-1.7B-Base/resolve/main/talker/model.safetensors"),
            ("predictor/model.safetensors", "https://huggingface.co/mlx-community/Qwen3-TTS-1.7B-Base/resolve/main/predictor/model.safetensors"),
            ("vocoder/model.safetensors", "https://huggingface.co/mlx-community/Qwen3-TTS-1.7B-Base/resolve/main/vocoder/model.safetensors"),
            ("tokenizer/tokenizer.json", "https://huggingface.co/darkautism/qwen3-tts/resolve/main/tokenizer/tokenizer.json"),
        ];

        for (relative_path, url) in required_files {
            let file_path = self.models_dir.join(relative_path);
            if !file_path.exists() {
                info!("Downloading MLX model file: {} -> {:?}", url, file_path);
                std::fs::create_dir_all(file_path.parent().unwrap())?;
                self.download_file(url, &file_path).await?;
            } else {
                info!("MLX model file already exists: {:?}", file_path);
            }
        }

        Ok(())
    }

    async fn download_file(&self, url: &str, path: &Path) -> Result<()> {
        let response = reqwest::get(url).await?;
        let bytes = response.bytes().await?;
        tokio::fs::write(path, bytes).await?;
        Ok(())
    }

    /// Get total model size in bytes
    pub fn get_model_size(&self) -> u64 {
        // Approximate sizes for Qwen3-TTS
        // Talker: ~768 MB
        // Predictor: ~206 MB
        // Vocoder: ~436 MB
        // Tokenizer: ~291 MB
        // Total: ~1.7 GB
        1_700_000_000
    }

    pub fn models_dir(&self) -> &Path {
        &self.models_dir
    }
}