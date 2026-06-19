# Структура проекта TTS Desktop App

## Корневая структура

```
tts-desktop/
├── Cargo.toml                 # Rust/Tauri конфиг
├── package.json               # Node.js зависимости (UI)
├── tauri.conf.json            # Tauri конфигурация
├── tsconfig.json              # TypeScript конфиг
├── vite.config.ts             # Vite конфиг (сборка UI)
├── index.html                 # Entry point HTML
│
├── src/                       # Фронтенд (React + TypeScript)
│   ├── main.tsx               # Точка входа React
│   ├── App.tsx                # Корневой компонент
│   ├── index.css              # Глобальные стили
│   │
│   ├── components/            # UI компоненты
│   │   ├── Editor/
│   │   │   ├── MarkdownEditor.tsx      # Milkdown редактор
│   │   │   ├── Toolbar.tsx             # Панель инструментов
│   │   │   └── VoiceSelector.tsx       # Выбор голоса
│   │   ├── FileManager/
│   │   │   ├── FileUploader.tsx        # Загрузка файлов
│   │   │   ├── FileList.tsx            # Список загруженных
│   │   │   └── FileParser.ts           # Парсеры (md, txt, pdf, docx, epub, fb2)
│   │   ├── AudioPlayer/
│   │   │   ├── AudioPlayer.tsx         # Плеер с waveform
│   │   │   ├── Timeline.tsx            # Таймлайн аудио
│   │   │   └── EffectsPanel.tsx        # Панель эффектов
│   │   ├── VoiceClone/
│   │   │   ├── VoiceRecorder.tsx       # Запись с микрофона
│   │   │   ├── VoiceCloneWizard.tsx    # Мастер клонирования
│   │   │   └── VoiceSamples.tsx        # Управление сэмплами
│   │   └── ModelManager/
│   │       ├── ModelDownloader.tsx     # Скачивание моделей
│   │       ├── ModelList.tsx           # Установленные модели
│   │       └── ModelSettings.tsx       # Настройки моделей
│   │
│   ├── hooks/                 # React хуки
│   │   ├── useTauriApi.ts     # Обёртка над Tauri invoke
│   │   ├── useAudioPlayback.ts  # Управление воспроизведением
│   │   ├── useVoiceClone.ts    # Логика клонирования
│   │   └── useModelManager.ts  # Управление моделями
│   │
│   ├── stores/                # Zustand сторы
│   │   ├── editorStore.ts     # Состояние редактора
│   │   ├── audioStore.ts      # Состояние аудио
│   │   ├── voiceStore.ts      # Голоса и клонирование
│   │   └── settingsStore.ts   # Настройки приложения
│   │
│   ├── types/                 # TypeScript типы
│   │   ├── file.ts            # Типы файлов
│   │   ├── voice.ts           # Типы голосов
│   │   ├── audio.ts           # Типы аудио
│   │   └── api.ts             # API контракты
│   │
│   └── utils/                 # Утилиты
│       ├── textSplitter.ts    # Разбивка текста на чанки
│       ├── audioMerger.ts     # Склейка аудио (Web Audio API)
│       └── effects.ts         # Применение эффектов
│
├── src-tauri/                 # Rust бэкенд (Tauri)
│   ├── Cargo.toml             # Rust зависимости
│   ├── build.rs               # Скрипт сборки
│   │
│   ├── src/
│   │   ├── main.rs            # Точка входа
│   │   ├── lib.rs             # Экспорт модулей
│   │   ├── error.rs           # Обработка ошибок
│   │   ├── commands/          # Tauri команды (API для фронта)
│   │   │   ├── mod.rs
│   │   │   ├── file.rs        # Загрузка/парсинг файлов
│   │   │   ├── tts.rs         # Генерация речи (Piper)
│   │   │   ├── audio.rs       # Обработка аудио (FFmpeg)
│   │   │   ├── voice_clone.rs # Клонирование голоса (XTTS sidecar)
│   │   │   ├── models.rs      # Управление моделями
│   │   │   └── settings.rs    # Настройки приложения
│   │   │
│   │   ├── services/          # Бизнес-логика
│   │   │   ├── mod.rs
│   │   │   ├── file_parser/   # Парсеры документов
│   │   │   │   ├── mod.rs
│   │   │   │   ├── markdown.rs
│   │   │   │   ├── text.rs
│   │   │   │   ├── pdf.rs     # pdf-extract / lopdf
│   │   │   │   ├── docx.rs    # docx-rs
│   │   │   │   ├── epub.rs    # epub-rs
│   │   │   │   └── fb2.rs     # xml-rs
│   │   │   ├── tts_engine/    # Движок озвучки
│   │   │   │   ├── mod.rs
│   │   │   │   ├── piper.rs   # Piper ONNX Runtime
│   │   │   │   ├── espeak.rs  # Phonemizer (опционально)
│   │   │   │   └── text_processor.rs # Нормализация текста
│   │   │   ├── audio_engine/  # Аудио обработка
│   │   │   │   ├── mod.rs
│   │   │   │   ├── merger.rs  # Склейка через FFmpeg
│   │   │   │   ├── effects.rs # Эффекты (reverb, eq)
│   │   │   │   └── encoder.rs # Экспорт в mp3/wav
│   │   │   ├── voice_clone/   # Клонирование голоса
│   │   │   │   ├── mod.rs
│   │   │   │   ├── sidecar.rs # Управление Python-процессом
│   │   │   │   ├── xtts_api.rs # HTTP API к XTTS
│   │   │   │   └── recorder.rs # Запись с микрофона
│   │   │   └── model_manager/ # Менеджер моделей
│   │   │       ├── mod.rs
│   │   │       ├── downloader.rs # Скачивание с HF
│   │   │       ├── storage.rs    # Хранение на диске
│   │   │       └── registry.rs   # Реестр моделей
│   │   │
│   │   ├── models/            # Rust структуры данных
│   │   │   ├── mod.rs
│   │   │   ├── file.rs
│   │   │   ├── voice.rs
│   │   │   ├── audio.rs
│   │   │   └── settings.rs
│   │   │
│   │   └── utils/             # Rust утилиты
│       │   ├── mod.rs
│       │   ├── paths.rs       # Пути к директориям
│       │   └── validators.rs  # Валидация входных данных
│   │
│   ├── sidecar/               # Внешние бинарники
│   │   ├── piper/             # Piper TTS engine
│   │   │   ├── piper.exe      # Windows
│   │   │   ├── piper           # Linux
│   │   │   └── piper.app       # macOS
│   │   ├── ffmpeg/            # FFmpeg для аудио
│   │   │   ├── ffmpeg.exe
│   │   │   └── ffprobe.exe
│   │   └── xtts/              # Python окружение XTTS
│   │       ├── python/        # Portable Python
│   │       ├── xtts_server.py # FastAPI сервер
│   │       └── requirements.txt
│   │
│   └── resources/             # Встроенные ресурсы
│       ├── icons/
│       └── default_voices/    # Голоса по умолчанию
│
├── models/                    # Скачанные модели (runtime)
│   ├── piper/
│   │   ├── ru_RU/             # Русские голоса
│   │   ├── en_US/             # Английские
│   │   └── ...
│   └── xtts/
│       ├── checkpoint/        # Чекпоинты XTTS
│       └── speakers/          # Клонированные голоса
│
├── docs/                      # Документация
│   ├── architecture.md
│   ├── api.md
│   └── build.md
│
├── scripts/                   # Скрипты сборки
│   ├── build-sidecars.sh      # Сборка бинарников
│   ├── download-models.py     # Загрузка моделей
│   └── setup-dev.sh           # Настройка окружения
│
└── tests/                     # Тесты
    ├── unit/
    └── e2e/
```

## Ключевые файлы

### Cargo.toml (корневой Rust)
```toml
[package]
name = "tts-desktop"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "2.0", features = ["shell-sidecar"] }
tokio = { version = "1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
anyhow = "1.0"
reqwest = { version = "0.12", features = ["json", "stream"] }
rodio = "0.19"                    # Аудио воспроизведение
pdf-extract = "0.7"               # PDF парсинг
docx-rs = "0.4"                   # DOCX парсинг
epub = "2.1"                      # EPUB парсинг
quick-xml = "0.31"                # FB2/XML
onnxruntime = "0.0.14"            # ONNX для Piper
hound = "3.5"                     # WAV чтение/запись
rubato = "0.14"                   # Ресемплинг аудио
```

### package.json (фронтенд)
```json
{
  "name": "tts-desktop-ui",
  "version": "0.1.0",
  "dependencies": {
    "react": "^18.3",
    "react-dom": "^18.3",
    "@tauri-apps/api": "^2.0",
    "@milkdown/core": "^7.4",
    "@milkdown/preset-commonmark": "^7.4",
    "@milkdown/react": "^7.4",
    "zustand": "^4.5",
    "wavesurfer.js": "^7.8"
  },
  "devDependencies": {
    "@types/react": "^18.3",
    "@vitejs/plugin-react": "^4.3",
    "typescript": "^5.4",
    "vite": "^5.2"
  }
}
```

## Поток данных

```
UI (React) 
  ↕ Tauri IPC (invoke/handle)
Rust Backend (Tauri Commands)
  → file_parser (pdf, docx, epub, fb2 → markdown)
  → tts_engine (markdown → phonemes → audio chunks)
  → audio_engine (chunks → merged + effects → final wav/mp3)
  → voice_clone (sidecar → XTTS API → cloned voice)
  → model_manager (download → storage → registry)
```

## Размеры (примерные)

| Компонент | Размер |
|-----------|--------|
| Tauri runtime | ~15 MB |
| React UI (minified) | ~2 MB |
| Piper + ONNX Runtime | ~80 MB |
| FFmpeg | ~40 MB |
| 4 голоса (Piper) | ~200 MB |
| XTTS sidecar (Python) | ~2 GB (опционально) |
| **Итого (без XTTS)** | **~350 MB** |
| **Итого (с XTTS)** | **~2.5 GB** |
