use tauri::Manager;
use tracing::{info, error};

mod tts;
mod audio;
mod parser;

use tts::engine::{TtsEngine, TtsConfig, DevicePreference};

#[derive(Clone)]
struct AppState {
    tts_engine: std::sync::Arc<tokio::sync::Mutex<TtsEngine>>,
}

#[tauri::command]
async fn initialize_tts(
    state: tauri::State<'_, AppState>,
    model_path: Option<String>,
) -> Result<String, String> {
    let engine = state.tts_engine.lock().await;
    
    let backend = if cfg!(all(target_os = "macos", feature = "mlx-backend")) {
        "MLX (Apple Silicon)"
    } else if cfg!(feature = "candle-backend") {
        "Candle"
    } else {
        "Unknown"
    };
    
    let device = if cfg!(all(target_os = "macos", feature = "mlx-backend")) {
        "Metal (Unified Memory)"
    } else {
        "CPU/CUDA"
    };
    
    Ok(format!("TTS initialized | Backend: {} | Device: {}", backend, device))
}

#[tauri::command]
async fn get_tts_info(
    state: tauri::State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let backend = if cfg!(all(target_os = "macos", feature = "mlx-backend")) {
        "MLX"
    } else if cfg!(feature = "candle-backend") {
        "Candle"
    } else {
        "Remote"
    };
    
    let device = if cfg!(all(target_os = "macos", feature = "mlx-backend")) {
        "Metal"
    } else {
        "CPU/CUDA"
    };
    
    Ok(serde_json::json!({
        "backend": backend,
        "device": device,
        "initialized": true,
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
    }))
}

#[tauri::command]
async fn synthesize_text(
    state: tauri::State<'_, AppState>,
    text: String,
    voice_id: Option<String>,
    speaker_prompt: Option<String>,
    emotion: Option<String>,
    speed: Option<f32>,
) -> Result<serde_json::Value, String> {
    let engine = state.tts_engine.lock().await;
    
    let request = tts::engine::SynthesisRequest {
        text,
        voice_id,
        speaker_prompt,
        emotion,
        speed: speed.unwrap_or(1.0),
        clone_voice_audio: None,
    };
    
    let result = engine.synthesize(request).await
        .map_err(|e| format!("Synthesis failed: {}", e))?;
    
    // Save to temp file and return path
    let temp_path = std::env::temp_dir().join(format!("tts_{}.wav", uuid::Uuid::new_v4()));
    std::fs::write(&temp_path, &result.audio_data)
        .map_err(|e| format!("Failed to write audio: {}", e))?;
    
    Ok(serde_json::json!({
        "file_path": temp_path.to_string_lossy().to_string(),
        "sample_rate": result.sample_rate,
        "duration_ms": result.duration_ms,
    }))
}

#[tauri::command]
async fn clone_voice(
    state: tauri::State<'_, AppState>,
    audio_data: Vec<u8>,
    voice_name: String,
) -> Result<String, String> {
    let engine = state.tts_engine.lock().await;
    let voice_id = engine.clone_voice(audio_data, voice_name).await
        .map_err(|e| format!("Voice cloning failed: {}", e))?;
    Ok(voice_id)
}

#[tauri::command]
async fn list_voices(state: tauri::State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let engine = state.tts_engine.lock().await;
    let voices = engine.list_voices();
    let voices_json: Vec<serde_json::Value> = voices.into_iter()
        .map(|v| serde_json::json!({
            "id": v.id,
            "name": v.name,
            "language": v.language,
            "gender": v.gender,
            "is_cloned": v.is_cloned,
        }))
        .collect();
    Ok(voices_json)
}

#[tauri::command]
async fn mix_audio_files(
    segments: Vec<serde_json::Value>,
    output_path: String,
    effects: Option<serde_json::Value>,
) -> Result<String, String> {
    audio::mixer::mix_segments(&segments, &output_path, effects)
        .map_err(|e| format!("Audio mixing failed: {}", e))?;
    Ok(output_path)
}

#[tauri::command]
async fn parse_document(path: String) -> Result<String, String> {
    parser::parse_to_markdown(&path)
        .map_err(|e| format!("Document parsing failed: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn main() {
    tracing_subscriber::fmt()
        .with_env_filter("info")
        .init();

    let runtime = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime");
    
    let tts_config = TtsConfig {
        model_dir: dirs::config_dir()
            .unwrap_or_else(|| std::path::PathBuf::from("."))
            .join("tts-app/models")
            .to_string_lossy()
            .to_string(),
        device_preference: DevicePreference::Auto,
        max_seq_length: 2048,
        sample_rate: 24000,
    };
    
    let tts_engine = runtime.block_on(async {
        TtsEngine::new(tts_config).await
            .expect("Failed to initialize TTS engine")
    });
    
    info!("Starting TTS App on {} {}", std::env::consts::OS, std::env::consts::ARCH);

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            tts_engine: std::sync::Arc::new(tokio::sync::Mutex::new(tts_engine)),
        })
        .invoke_handler(tauri::generate_handler![
            initialize_tts,
            get_tts_info,
            synthesize_text,
            clone_voice,
            list_voices,
            mix_audio_files,
            parse_document,
        ])
        .setup(|app| {
            info!("TTS App started successfully");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}