# TTS App — Desktop Text-to-Speech

Desktop приложение для озвучки текста на базе **Qwen3-TTS** (Alibaba).

## Архитектура

- **Frontend**: React + TypeScript + Vite + Tauri
- **Backend**: Rust + Tauri
- **ML Backend**:
  - **macOS (Apple Silicon)**: MLX (оптимизировано под M1/M2/M3, Unified Memory)
  - **Windows / Linux / Intel Mac**: Candle (HuggingFace, GGUF)
- **Vocoder**: ONNX Runtime (все платформы)
- **Audio**: Hound, Symphonia, FFmpeg

## Требования

### Общие
- Rust 1.78+
- Node.js 20+
- ONNX Runtime libraries (системные или bundled)

### macOS
- macOS 14+ (Sonoma)
- Xcode Command Line Tools
- Для Apple Silicon: MLX использует Unified Memory автоматически

### Windows
- Windows 10/11
- Visual Studio 2022 Build Tools (C++ workload)
- CUDA Toolkit 12.x (опционально, для GPU ускорения)

## Сборка

### macOS (Apple Silicon — рекомендуется MLX)

```bash
# Клонировать darkautism/qwen3-tts (если используешь форк как git dependency)
git clone https://github.com/darkautism/qwen3-tts.git ../qwen3-tts

# Установить зависимости
npm install

# Сборка в dev-режиме с MLX backend
cargo tauri dev --features tts-local-macos

# Production сборка
cargo tauri build --features tts-local-macos
```

### macOS (Intel — Candle fallback)

```bash
cargo tauri dev --features tts-local
```

### Windows

```bash
# Установить зависимости
npm install

# Dev режим
cargo tauri dev --features tts-local

# Production сборка (создаст .msi и .exe в src-tauri/target/release/bundle/)
cargo tauri build --features tts-local
```

### Кросс-компиляция

Tauri официально не поддерживает кросс-компиляцию. Для CI/CD используй GitHub Actions с matrix:

```yaml
strategy:
  matrix:
    include:
      - target: x86_64-pc-windows-msvc
        os: windows-latest
        features: tts-local
      - target: x86_64-apple-darwin
        os: macos-latest
        features: tts-local
      - target: aarch64-apple-darwin
        os: macos-latest
        features: tts-local-macos
```

## Feature Flags

| Feature | Описание | Платформы |
|---------|----------|-----------|
| `tts-local` | Локальный TTS через Candle | Windows, Linux, Intel Mac |
| `tts-local-macos` | Локальный TTS через MLX | Apple Silicon Mac |
| `candle-backend` | Candle ML backend | Не-macOS |
| `mlx-backend` | MLX ML backend | macOS только |
| `onnx-vocoder` | ONNX Runtime для Vocoder | Все |
| `remote-tts` | Серверный режим TTS | Все |

## Модели

При первом запуске приложение скачает модели с HuggingFace (~2.5 GB):

- Talker (GGUF): ~768 MB
- Predictor: ~206 MB
- Tokenizer: ~291 MB
- Vocoder (ONNX): ~436 MB
- Speech Tokenizer: ~651 MB

Модели кэшируются в `~/.config/tts-app/models/`.

## Лицензия

MIT