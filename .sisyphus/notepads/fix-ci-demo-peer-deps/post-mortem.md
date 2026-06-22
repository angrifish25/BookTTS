# Post-mortem: Исправление peer dependency conflict в CI

## Ошибка

```
npm error ERESOLVE could not resolve
npm error peer vite@"^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0" from @vitejs/plugin-react@4.7.0
npm error Conflicting peer dependency: vite@7.3.5
```

## Шаги по воспроизведению и диагностике

### Шаг 1. Прочитать корневые файлы проекта

- **`package.json`** (корень): содержит `vite@^8.0.16` + `@vitejs/plugin-react@^4.3`
- **`frontend/package.json`**: содержит `vite@^5.4` + `@vitejs/plugin-react@^4.3` (совместимы)
- **`.github/workflows/deploy-demo.yml`**: запускает `npm install` и `npm run build:demo` из **корня**

**Вывод:** `plugin-react@4.3` требует `vite@^4||^5||^6||^7`, а в корне стоит `vite@8`. Конфликт peer dependency.

### Шаг 2. Выбрать стратегию фикса

Варианты:
- Понизить `vite` в корне до `^5.4` — нежелательно, т.к. в корне явно выбран vite 8 по каким-то причинам.
- Обновить `plugin-react` до версии, поддерживающей `vite@8`.

Проверка версий через `npm view`:
- `plugin-react@4.x` и `@5.0.x–5.1.x` → peer: `vite ^4||^5||^6||^7` ❌
- **`plugin-react@5.2.0`** → peer: `vite ^4||^5||^6||^7||^8` ✅

**Выбрано:** обновить `@vitejs/plugin-react` в корневом `package.json` до `^5.2.0`.

### Шаг 3. Обнаружить дополнительную проблему в CI

В workflow вызывается `npm run build:demo`, но в корневом `package.json` такого скрипта **нет** (есть только во `frontend/package.json`).

**Вывод:** нужно добавить скрипт `"build:demo": "cd frontend && npm run build:demo"` в корневой `package.json`, чтобы соответствовать паттерну уже существующих скриптов `dev` и `build`.

### Шаг 4. Применить изменения в корневом `package.json`

1. Заменить `"@vitejs/plugin-react": "^4.3"` → `"@vitejs/plugin-react": "^5.2.0"`
2. Добавить `"build:demo": "cd frontend && npm run build:demo"` в секцию `scripts`

### Шаг 5. Обновить корневой `package-lock.json`

Запустить `npm install` в корне, чтобы lockfile обновился с новой версией плагина. Без этого CI мог бы продолжать разрешать старую версию.

### Шаг 6. Локальная верификация `npm install`

`npm install` прошёл успешно (0 vulnerabilities).

### Шаг 7. Локальная верификация `npm run build:demo`

**ОШИБКА:** Build failed — `[vite:css] [postcss] ... The 'prose' class does not exist.`

**Диагностика:**
- `vite.config.demo.ts` использует `root: process.cwd()`.
- Tailwind через PostCSS ищет конфиг относительно текущей директории.
- Он находит **`tailwind.config.js`** (без плагина typography), а не `tailwind.config.demo.js`.
- Поэтому класс `prose` (из `@tailwindcss/typography`) не определён.

**Разница между двумя конфигами:**
- `tailwind.config.js` → `plugins: []`
- `tailwind.config.demo.js` → `plugins: [require('@tailwindcss/typography')]`

**Фикс:** добавить `require('@tailwindcss/typography')` в основной `tailwind.config.js`. Это безопасно, т.к. плагин просто добавляет утилитарные классы и не ломает существующую сборку.

### Шаг 8. Повторная верификация

- `npm run build:demo` → **SUCCESS** ✅
- `npm run build` (обычная сборка) → **SUCCESS** ✅
- Директория `demo-dist/` создаётся корректно.

## Итоговые изменения файлов

| Файл | Изменение |
|------|-----------|
| `package.json` | `@vitejs/plugin-react` обновлён с `^4.3` до `^5.2.0` |
| `package.json` | Добавлен скрипт `"build:demo": "cd frontend && npm run build:demo"` |
| `package-lock.json` | Перегенерирован через `npm install` |
| `frontend/tailwind.config.js` | Добавлен плагин `@tailwindcss/typography` |

## Чеклист проверки

- [x] `npm install` в корне выполняется без ошибок `ERESOLVE`
- [x] `npm run build:demo` в корне выполняется успешно
- [x] `npm run build` (обычная сборка) продолжает работать
- [x] GitHub Actions workflow `Deploy Demo` не должен падать на шаге установки зависимостей
