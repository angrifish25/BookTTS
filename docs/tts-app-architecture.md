# Архитектура десктопного TTS-приложения (Qwen3-TTS Rust Edition)

## 1. Общая концепция: Гибридная архитектура Local + Server

Приложение построено вокруг **Qwen3-TTS-1.7B** — единой модели, которая покрывает все сценарии озвучки:
- Стандартная озвучка 10+ языков (включая русский)
- Zero-shot клонирование голоса с 3-6 секунд аудио
- Voice Design — создание голоса по текстовому описанию
- Управление эмоциями через текстовые инструкции ("скажи шёпотом", "грустным тоном")
- Стриминг с задержкой ~97 мс

**Ключевое решение:** приложение работает в двух режимах — **Local** (модель на устройстве) и **Remote** (модель на сервере через API). Пользователь выбирает при установке или переключается в настройках.

| Режим | Качество | Требования | Размер | Интернет |
|-------|----------|------------|--------|----------|
| **Local** | Максимальное | CPU (работает) / GPU (быстро) | ~2.5-3 ГБ | Не нужен |
| **Remote** | Максимальное | Любой ПК / ноутбук | ~150-200 МБ | Нужен |
| **Hybrid** | Адаптивное | GPU опционально | ~200 МБ + кэш | Опционально |

**Рекомендуемый стек:** Tauri 2.x + React + TypeScript + Rust TTS Engine (Candle GGUF + ONNX Runtime)

---

## 2. Почему не Python Sidecar?

Оригинальный Qwen3-TTS от Alibaba — это PyTorch-модель, и изначально я предлагал Python sidecar. Но сообщество уже портировало движок на Rust и C++:

- **darkautism/qwen3-tts** — полностью Rust-реализация. Talker (LLM) + Predictor (CodePredictor) + Voice Encoder (Mimi) работают на **Candle** (нативный Rust ML-фреймворк от HuggingFace) с GGUF. Только Vocoder требует ONNX Runtime.
- **Serveurperso/qwentts.cpp** — C++17/GGML порт с поддержкой CUDA, Vulkan, Metal, CPU.

**Вывод:** Python не нужен. Приложение — это единый нативный бинарник на Rust + ONNX Runtime для vocoder.

---

## 3. Выбор стека

### Frontend
- **Framework:** React 18+ + TypeScript
- **Bundler:** Vite
- **Editor:** Milkdown (Markdown WYSIWYG на ProseMirror) — UX как в Notion
- **Audio Player:** WaveSurfer.js (визуализация waveform, регионы по предложениям)
- **State:** Zustand (глобальное состояние) + TanStack Query (API calls)
- **UI Kit:** Tailwind CSS + Radix UI (headless компоненты)

### Backend / Desktop Shell
- **Tauri 2.x** (Rust) — нативный доступ к ФС, микрофону, процессам
- **FFmpeg** — bundled бинарник для аудио-обработки
- **SQLite** (rusqlite) — библиотека книг, закладки, настройки

### TTS Engine (Local) — Rust Native
- **Candle** (HuggingFace) — inference Talker + Predictor + Voice Encoder. Pure Rust, GGUF-формат, никаких внешних зависимостей.
- **ONNX Runtime** (через Rust crate `ort`) — только для Vocoder (декодер аудио-кодов в WAV). Требует `libonnxruntime.so` / `.dll` / `.dylib` (~40-80 МБ).
- **GGUF модели** — Q8_0 или Q4_K_M квантизация. Размер ~1.5-2.3 ГБ.

### TTS Engine (Remote)
- **HTTP/REST API** — собственный сервер с Qwen3-TTS
- **WebSocket** — для стриминговой озвучки (low latency)
- **Auth:** JWT токены, привязка к лицензии

---

## 3.1 Кросс-платформенная архитектура движка

Приложение собирается под **Windows** и **macOS** с разными нативными ML-движками:

### Windows (x86_64)
- **Candle** (HuggingFace) — inference Talker + Predictor + Voice Encoder
- **ONNX Runtime** — Vocoder (CUDA/CPU)
- **Формат моделей:** GGUF (Q8_0 / Q4_K_M)

### macOS (Apple Silicon M1/M2/M3/M4)
- **MLX** (Apple) — нативный фреймворк Apple для M-серии чипов. Даёт **2-3× прирост** по сравнению с Candle+Metal.
- **Candle + Metal** — fallback для Intel Mac или если MLX недоступен
- **ONNX Runtime** — Vocoder (через CoreML или CPU)
- **Формат моделей:** MLX-специфичный формат или Safetensors (через `mlx-community/Qwen3-TTS-1.7B-Base`)

### Абстракция в коде (Rust)

```rust
// src/tts/backends/mod.rs
#[async_trait]
pub trait TtsBackend: Send + Sync {
    async fn initialize(&mut self, models_dir: &Path) -> Result<()>;
    async fn synthesize(&mut self, text: &str, voice: &VoiceConfig, options: &SynthesisOptions, output: &Path) -> Result<()>;
    async fn clone_voice(&mut self, audio_path: &Path) -> Result<Tensor>;
}

// Фабрика выбирает бэкенд при компиляции
pub fn create_backend() -> Box<dyn TtsBackend> {
    #[cfg(all(target_os = "macos", feature = "mlx-backend"))]
    return Box::new(mlx::MlxBackend::new());
    
    #[cfg(not(all(target_os = "macos", feature = "mlx-backend")))]
    return Box::new(candle::CandleBackend::new());
}
```

### Сборка

```bash
# Windows (Candle + ONNX)
cargo build --release --features candle-backend

# macOS Apple Silicon (MLX — рекомендуется)
cargo build --release --features mlx-backend

# macOS Intel (Candle + Metal fallback)
cargo build --release --features candle-backend
```

### Производительность по платформам

| Платформа | Движок | Скорость | RTF | Примечание |
|-----------|--------|----------|-----|------------|
| Windows + RTX 3060 | Candle + ONNX CUDA | ~0.2-0.4× | Очень быстро | Лучший вариант на Windows |
| Windows + CPU i7 | Candle + ONNX CPU | ~1.0-1.5× | Комфортно | Для ноутбуков без GPU |
| macOS M1/M2 | MLX | ~0.3-0.6× | Быстро | Нативный Apple фреймворк |
| macOS M1/M2 | Candle + Metal | ~0.8-1.2× | Комфортно | Fallback |
| macOS Intel | Candle + CPU | ~1.5-2.5× | Медленно | Работает, но медленно |

**Вывод:** MLX на Apple Silicon даёт существенный прирост. Для macOS рекомендуется MLX-бэкенд.

---

## 4. Модульная архитектура

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UI Layer (WebView)                                 │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │  Editor  │ │ File Import│ │ Voice    │ │ Audio Player │ │ Voice       │ │
│  │(Milkdown)│ │ (parsers)  │ │ Settings │ │ (WaveSurfer) │ │ Cloner      │ │
│  └────┬─────┘ └─────┬──────┘ └────┬─────┘ └──────┬───────┘ └──────┬──────┘ │
│       │             │             │              │                │        │
│  ┌────┴─────────────┴─────────────┴──────────────┴────────────────┴───────┐ │
│  │                    Tauri Commands (IPC) + HTTP Client                    │ │
│  └──────────────────────────────┬─────────────────────────────────────────┘ │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────────────────────┐
│  Core Layer (Rust)               │                                          │
│  ┌──────────────────────────────┴─────────────────────────────────────────┐ │
│  │  Document Parser Service                                               │ │
│  │  (txt, md, docx, pdf, fb2, epub → unified Markdown)                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  TTS Orchestrator                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │ │
│  │  │ Local Engine │  │ Remote Engine│  │     Model Manager            │ │ │
│  │  │ (Rust Candle │  │ (HTTP/WebSock│  │  • Download / Update         │ │ │
│  │  │  + ONNX)     │  │  et client)  │  │  • Switch local ↔ remote     │ │ │
│  │  └──────────────┘  └──────────────┘  │  • Cache management          │ │ │
│  │                                      └──────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Audio Pipeline Service                                                │ │
│  │  • Sentence splitter & queue                                           │ │
│  │  • Audio concatenation (FFmpeg) + crossfade                            │ │
│  │  • Effects (reverb, EQ, normalize, ambience)                           │ │
│  │  • Export (mp3, wav, ogg, m4b audiobook)                               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Storage & Config                                                      │ │
│  │  • SQLite (books, bookmarks, settings, voice presets)                  │ │
│  │  • File system (models, audio cache, user voices)                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Qwen3-TTS Rust Engine: детальная архитектура

### 5.1 Компоненты движка

Qwen3-TTS состоит из трёх частей. В Rust-реализации darkautism/qwen3-tts они распределены так:

| Компонент | Функция | Реализация | Размер модели |
|-----------|---------|------------|---------------|
| **Talker** | LLM: текст → аудио-коды (12 Hz) | Candle + GGUF | ~768 МБ (Q8_0) |
| **Predictor** | CodePredictor: уточнение кодов | Candle + GGUF | ~206 МБ (Q8_0) |
| **Voice Encoder** | Mimi Tokenizer: аудио → эмбеддинг | Candle (safetensors) | ~651 МБ |
| **Vocoder** | SEANet + ConvNeXt + DAC: коды → WAV | ONNX Runtime | ~436 МБ (FP32) |
| **Tokenizer** | Текстовый токенизатор | HuggingFace (Rust) | ~11 МБ |

**Итого модели:** ~2.3 ГБ в Q8_0. В Q4_K_M — ~1.5 ГБ.

### 5.2 Поток данных (Local Mode)

```
[Текст из редактора]
    ↓
[Text Tokenizer] → Candle/HF Tokenizer
    ↓
[Talker LLM] → Candle GGUF inference → генерирует 12 Hz аудио-коды
    ↓
[Predictor] → Candle GGUF → уточняет коды (MTP head)
    ↓
[Vocoder] → ONNX Runtime → декодирует коды в WAV 24kHz mono
    ↓
[Audio Pipeline] → FFmpeg → склейка, эффекты, экспорт
```

### 5.3 Voice Cloning (Zero-Shot)

```
[Микрофон] → [Запись 3-10 сек] → [WAV 16kHz mono]
    ↓
[Mimi Speech Tokenizer] → Candle (Rust) → Voice Embedding
    ↓
[Сохранение в SQLite + ФС] → [Использование в Talker как speaker prompt]
```

Клонирование работает полностью на Rust (Mimi encoder на Candle), без Python.

### 5.4 Voice Design

Режим `voicedesign` доступен только в 1.7B-модели. Генерирует голос по текстовому описанию через тот же Talker, но с особым промптом.

### 5.5 Производительность (оценки)

На основе бенчмарков darkautism/qwen3-tts на RK3588 (ARM, 4×A76 + 4×A55):

| Конфигурация | Скорость | RTF | Платформа |
|--------------|----------|-----|-----------|
| Candle Q8_0, big-core pinning | ~5.5 tok/s | ~2.6× | RK3588 ARM |
| Candle Q4_0, big-core pinning | ~6.3 tok/s | ~2.3× | RK3588 ARM |
| ONNX CUDA (Vocoder) | — | ускорение декодера | NVIDIA GPU |

**Экстраполяция на x86 Desktop (CPU):**
- Intel i5-12400 / AMD Ryzen 5 5600X: RTF ~1.0-1.5× (реальное время или близко)
- Intel i7-13700 / AMD Ryzen 7 7700X: RTF ~0.5-0.8× (быстрее реального времени)

**С GPU (ONNX Runtime CUDA):**
- RTX 3060: Vocoder ускоряется в 5-10×, общий RTF ~0.2-0.4×
- RTX 4060/4070: RTF ~0.1-0.2×

**Вывод:** На современном CPU (6+ ядер) озвучка книги вполне комфортна. GPU не обязателен, но даёт существенный буст.

---

## 6. Подсистема работы с документами

| Формат | Библиотека (Rust) | Выход |
|--------|-------------------|-------|
| `.txt` | Нативное чтение + encoding detection | Markdown |
| `.md` | Прямое чтение | Markdown |
| `.docx` | `docx-rs` / mammoth.js | Markdown |
| `.pdf` | `pdf-extract` / `poppler` | Markdown (с заголовками) |
| `.fb2` | XML-парсер (quick-xml) | Markdown |
| `.epub` | `epub` crate | Markdown |

**Pipeline:**
```
[File] → [Format Detection] → [Parser] → [Markdown Normalizer] → [Editor]
                                            ↓
                                    [Structure Extractor]
                                    (заголовки → оглавление → M4B chapters)
```

**Редактор:** Milkdown (ProseMirror-based)
- WYSIWYG редактирование
- Синхронизация с внутренним Markdown
- Подсветка синтаксиса для SSML/эмоций (опционально)

---

## 7. Voice Cloning & Voice Design

### 7.1 Клонирование голоса (Zero-Shot)

**Процесс:**
```
[Микрофон] → [Запись 3-10 сек] → [WAV 16kHz mono] → [Mimi Encoder / Candle]
                                                          ↓
                                                    [Voice Embedding]
                                                          ↓
                                                    [Сохранение в SQLite + ФС]
                                                          ↓
                                                    [Использование для озвучки]
```

**UI:**
- Кнопка "Записать голос" → анимация записи с waveform
- Предпрослушивание записи
- Название голоса + теги
- Тестовая фраза для проверки клонирования

**Хранение:**
- Оригинальная запись: `voices/{voice_id}/sample.wav`
- Эмбеддинг / конфиг: `voices/{voice_id}/config.json`
- Метаданные: SQLite table `user_voices`

### 7.2 Voice Design (Создание голоса по описанию)

Qwen3-TTS поддерживает создание голоса по текстовому промпту:
- "Глубокий мужской голос, 45 лет, с лёгким бархатным тембром"
- "Молодой женский голос, энергичный, как у диктора новостей"

**Реализация:**
```
[Текстовое описание] → [Talker Voice Designer mode] → [Сгенерированный голос]
                                                          ↓
                                                    [Сохранение + тест]
```

---

## 8. Аудио пайплайн

### 8.1 Обработка текста перед синтезом

```
[Markdown Text]
    ↓
[Text Preprocessor]
    • SSML-разметка (паузы, ударение, скорость) — опционально
    • Sentence Tokenizer (rust-tokenizer / razor)
    • Paragraph grouping (chunk size ~500-1000 символов)
    • Emotion markers: "[шёпотом]", "[взволнованно]" → Qwen3-TTS prompt
    ↓
[TTS Queue]
    • Chunk-by-chunk synthesis (parallel: 2-4 потока)
    • Cache (hash текста + voice_id → аудиофайл)
    ↓
[Audio Assembler]
    • Concatenate WAV chunks
    • Crossfade между фрагментами (50-150 мс)
    • Normalize loudness (EBU R128 / ReplayGain)
    ↓
[Effects Engine] (опционально)
    • Reverb (room simulation)
    • EQ (voice enhancement)
    • Compression
    • Background ambience (rain, cafe, etc.)
    ↓
[Exporter]
    • WAV, MP3 (320kbps), OGG, FLAC
    • M4B (Audiobook с главами из заголовков Markdown)
```

### 8.2 Инструменты

| Задача | Инструмент | Примечание |
|--------|-----------|------------|
| Склейка + эффекты | FFmpeg | Bundled бинарник |
| Аудио анализ (Rust) | `symphonia`, `rubato` | Для плеера |
| Визуализация | WaveSurfer.js | В UI |
| Громкость | `ffmpeg -af loudnorm` | EBU R128 |

---

## 9. Дистрибуция и режимы

### 9.1 Структура установщика

```
MyTTSApp/
├── mytts.exe                    # Tauri бинарник (Rust)
├── onnxruntime.dll              # ONNX Runtime (Vocoder)
├── ffmpeg.exe                   # Bundled FFmpeg
├── resources/
│   └── ui-assets/
├── voices/                      # Пользовательские голоса (клоны)
├── models/                      # Qwen3-TTS модели (скачиваются отдельно)
│   └── qwen3-tts/
│       ├── talker/
│       ├── predictor/
│       ├── vocoder/
│       └── speech_tokenizer/
├── audio-cache/                 # Кэш синтезированного аудио
└── config.sqlite                # Настройки и библиотека
```

### 9.2 Варианты дистрибуции

| Вариант | Размер установщика | Содержимое | Интернет |
|---------|-------------------|------------|----------|
| **Lite** | ~80-120 МБ | App + FFmpeg + ONNX Runtime | Нужен для скачивания моделей |
| **Standard** | ~2.5-3 ГБ | App + FFmpeg + ONNX + Qwen3-TTS Q8_0 | Не нужен |
| **Remote-only** | ~80 МБ | App + FFmpeg (без моделей) | Нужен постоянно |

**Рекомендация:** Lite + встроенный менеджер загрузки моделей.

### 9.3 Менеджер моделей

Встроенный UI для:
- Скачивания GGUF-моделей с HuggingFace (Serveurperso/Qwen3-TTS-GGUF или kautism/qwen3-tts-rk3588)
- Прогресса загрузки (resume поддержка)
- Проверки целостности (SHA256)
- Удаления / обновления моделей
- Переключения между Q8_0 и Q4_K_M (скорость vs качество)

---

## 10. Технические ограничения и решения

### 10.1 Размер и производительность

| Параметр | Значение | Решение |
|----------|----------|---------|
| Модели Qwen3-TTS | ~2.3 ГБ (Q8_0) / ~1.5 ГБ (Q4_K_M) | Менеджер загрузки, выбор квантизации |
| ONNX Runtime | ~40-80 МБ (libonnxruntime) | Bundled с установщиком |
| Скорость на CPU (6 ядер) | RTF ~1.0-1.5× | Комфортно для книг |
| Скорость на GPU (RTX 3060) | RTF ~0.2-0.4× | Очень быстро |
| RAM при загрузке | ~4-6 ГБ | Lazy loading моделей |

### 10.2 CPU vs GPU

| Режим | Скорость | Требования | Рекомендация |
|-------|----------|------------|--------------|
| CPU (6+ ядер) | RTF ~1.0-1.5× | Любой современный CPU | Основной режим |
| CUDA (RTX 3060) | RTF ~0.2-0.4× | NVIDIA GPU 6+ ГБ | Для скорости |
| Vulkan | RTF ~0.5-1.0× | AMD/Intel/NVIDIA GPU | Кроссплатформа |
| Apple Metal | RTF ~0.5-1.0× | Mac M1/M2/M3 | Через ONNX Runtime |

**Решение:**
- Автоопределение GPU при первом запуске
- ONNX Runtime автоматически выбирает лучший backend (CUDA → Vulkan → CPU)
- Предупреждение в UI если только CPU
- Предложение переключиться на Remote mode

### 10.3 ONNX Runtime зависимость

**Проблема:** Vocoder требует ONNX Runtime (C++ библиотека).

**Решения:**
- Bundled `libonnxruntime.so` / `.dll` / `.dylib` в установщике
- Статическая линковка (если возможна лицензия MIT)
- Автоматический fallback на CPU-execution provider если GPU недоступен

---

## 11. API между UI и Engine

### 11.1 Tauri Commands (IPC) — для UI → Rust

```typescript
// Примеры команд
invoke('import_document', { path: 'book.pdf' })
invoke('synthesize', { text: 'Привет мир', voiceId: 'user_voice_1', emotion: 'neutral' })
invoke('start_voice_cloning', { audioPath: 'recording.wav', name: 'Мой голос' })
invoke('export_audiobook', { format: 'm4b', addChapters: true })
invoke('switch_tts_mode', { mode: 'local' | 'remote' })
invoke('download_model', { quant: 'q8_0' })
invoke('get_system_info', {}) // → { cpu_cores, ram_gb, gpu_name, has_cuda }
```

### 11.2 Внутренний Rust API (TTS Engine)

```rust
// Пример интерфейса (псевдокод)
pub struct TtsEngine {
    talker: TalkerWorker,      // Candle GGUF
    predictor: PredictorWorker, // Candle GGUF
    vocoder: VocoderSession,    // ONNX Runtime
    voice_encoder: MimiEncoder, // Candle safetensors
}

impl TtsEngine {
    pub fn synthesize(&self, text: &str, voice: VoiceConfig) -> Result<AudioBuffer>;
    pub fn clone_voice(&self, audio: &[u8], ref_text: &str) -> Result<VoiceEmbedding>;
    pub fn design_voice(&self, description: &str) -> Result<VoiceConfig>;
    pub fn stream_synthesize(&self, text: &str, voice: VoiceConfig) -> impl Stream<Item=AudioChunk>;
}
```

### 11.3 HTTP API (Remote Mode)

```
POST /api/v1/synthesize
Body: {
  "text": "string",
  "voice_id": "string",
  "emotion": "neutral | whisper | excited | sad | angry",
  "speed": 1.0,
  "stream": false
}
Response: { "audio_url": "...", "duration": 12.5 }

POST /api/v1/clone
Body: multipart/form-data (audio_file, name)
Response: { "voice_id": "uuid", "status": "ready" }

POST /api/v1/design_voice
Body: { "description": "string", "name": "string" }
Response: { "voice_id": "uuid", "preview_url": "..." }

WS /api/v1/stream
→ { "text": "...", "voice_id": "..." }
← binary audio chunks (PCM / MP3)
```

---

## 12. Интеграция с darkautism/qwen3-tts

### 12.1 Вариант A: Использовать как библиотеку (рекомендуется)

Добавить в `Cargo.toml`:
```toml
[dependencies]
qwen3-tts = { git = "https://github.com/darkautism/qwen3-tts" }
candle-core = "0.8"
candle-nn = "0.8"
ort = "2.0" # ONNX Runtime Rust bindings
```

**Плюсы:**
- Полный контроль над UI (Tauri + React)
- Интеграция с системой (ФС, микрофон, SQLite)
- Кастомный аудио-пайплайн (FFmpeg, эффекты)

**Минусы:**
- Нужно писать обвязку Tauri ↔ Candle
- ONNX Runtime надо bundlить

### 12.2 Вариант B: Использовать как sidecar (HTTP API)

Запускать `qwen3-tts serve` как отдельный процесс, общаться через HTTP API.

**Плюсы:**
- Меньше кода — уже готовый API
- Можно обновлять движок независимо от UI

**Минусы:**
- Дополнительный процесс
- Меньше контроля над аудио-пайплайном

### 12.3 Вариант C: C++ FFI (qwentts.cpp)

Использовать Serveurperso/qwentts.cpp через Rust FFI (`bindgen` + `cc`).

**Плюсы:**
- Максимальная производительность (GGML/CUDA/Vulkan/Metal)
- Один бинарник без ONNX Runtime

**Минусы:**
- Сложнее сборка (cmake, C++ toolchain)
- FFI-overhead

---

## 13. Roadmap

### MVP (v0.1) — 3-4 недели
- [ ] Tauri + React + Milkdown скелет
- [ ] Импорт TXT, MD, PDF
- [ ] Интеграция Qwen3-TTS через darkautism/qwen3-tts (Candle + ONNX)
- [ ] Базовая озвучка (play/pause/seek)
- [ ] Экспорт в MP3/WAV

### v0.2 — +2-3 недели
- [ ] DOCX, FB2, EPUB импорт
- [ ] Voice Cloning (запись с микрофона → Mimi encoder)
- [ ] Voice Design (по описанию)
- [ ] Кэш аудио
- [ ] Менеджер моделей (скачивание GGUF с HF)

### v0.3 — +2-3 недели
- [ ] Remote mode (API client)
- [ ] WebSocket стриминг
- [ ] Звуковые эффекты (reverb, normalize)
- [ ] Экспорт M4B с главами
- [ ] SSML / эмоции в редакторе

### v1.0 — +1-2 месяца
- [ ] Гибридный режим (auto local/remote)
- [ ] Batch processing (очередь книг)
- [ ] Квантизация Q4_K_M (меньше размер, больше скорость)
- [ ] Самостоятельный сервер (Docker image)
- [ ] Магазин голосов (пресеты от сообщества)

---

## 14. Альтернативные стеки

### Вариант A: Python + PyQt (для чисто локального приложения)
- **Плюсы:** Весь TTS-стек на Python, проще интеграция оригинального Qwen3-TTS
- **Минусы:** Размер 500+ МБ, менее современный UI
- **Для кого:** Если команда сильна в Python, не нужен Remote mode

### Вариант B: Electron + Rust TTS Engine
- **Плюсы:** Привычный стек для web-разработчиков
- **Минусы:** Размер 300+ МБ только UI, медленнее Tauri
- **Для кого:** Если команда не знает Rust

### Вариант C: darkautism/qwen3-tts standalone
- **Плюсы:** Уже готовый Rust бинарник с WebUI
- **Минусы:** Простой WebUI, нет редактора документов, нет аудио-пайплайна
- **Для кого:** Если нужен быстрый CLI/API инструмент

---

## Итоговая рекомендация

**Стек:** Tauri 2.x + React + TypeScript + Rust (Candle + ONNX Runtime) + Qwen3-TTS GGUF

**Ключевые компоненты:**
1. **UI:** React + Milkdown + WaveSurfer.js + Tailwind
2. **Desktop:** Tauri (Rust) — ФС, микрофон, процессы, SQLite
3. **TTS Local:** Rust Candle (Talker + Predictor + Voice Encoder) + ONNX Runtime (Vocoder)
4. **TTS Remote:** HTTP/WebSocket API client к собственному серверу
5. **Аудио:** FFmpeg (bundled) для склейки, эффектов, экспорта
6. **Хранение:** SQLite для метаданных, ФС для моделей и аудио

**Размер дистрибутива:**
- Lite (без модели): ~80-120 МБ
- Standard (с Qwen3-TTS Q8_0): ~2.5-3 ГБ
- Remote-only: ~80 МБ

**Преимущества:**
- **Никакого Python** — единый нативный бинарник
- Единая модель для всех сценариев (озвучка, клонирование, дизайн, эмоции)
- Работает на CPU (не требует GPU)
- Максимальное качество речи
- Гибкость: работает и локально, и через сервер
- Современный UI без тормозов (Tauri vs Electron)
- Полный offline после установки (Local mode)

**Риски:**
- ONNX Runtime зависимость для vocoder (нужно bundlить)
- Размер модели ~2.3 ГБ
- Rust сложнее в разработке, чем Python

**Митигация:**
- Bundled ONNX Runtime в установщике
- Lite installer с менеджером загрузки моделей
- Q4_K_M квантизация для уменьшения размера
- Использование готового darkautism/qwen3-tts как основы движка
