pub mod engine;
pub mod model_manager;

// Backends are kept for future extensibility but not publicly exported yet
// pub mod backends;

pub use engine::{TtsEngine, TtsConfig, DevicePreference, SynthesisRequest, SynthesisResult, VoiceInfo};
pub use model_manager::ModelManager;