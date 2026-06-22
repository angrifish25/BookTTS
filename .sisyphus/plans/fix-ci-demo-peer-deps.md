# План: Фикс CI-сборки демо (peer dependency conflict)

## Контекст

**Ошибка:**
```
npm error ERESOLVE could not resolve
npm error peer vite@"^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0" from @vitejs/plugin-react@4.7.0
npm error Conflicting peer dependency: vite@7.3.5
```

**Корневая причина:**
- В корневом `package.json` установлен `vite@^8.0.16` + `@vitejs/plugin-react@^4.3`.
- `@vitejs/plugin-react` версии 4.x и 5.0.x–5.1.x **не поддерживают** `vite@8`. Поддержка vite@8 появилась только в `@vitejs/plugin-react@5.2.0` и выше.
- Также в `deploy-demo.yml` вызывается `npm run build:demo`, но такого скрипта **нет** в корневом `package.json` (есть только во `frontend/package.json`).

## Что нужно сделать

### 1. Обновить `devDependencies` в корневом `package.json`

**Файл:** `/Users/chevydev/Projects/BooksTTS/package.json`

Заменить:
```json
"@vitejs/plugin-react": "^4.3",
```

На:
```json
"@vitejs/plugin-react": "^5.2.0",
```

**Почему именно 5.2.0:**
- 4.x → peer: vite ^4||^5||^6||^7 ❌
- 5.0.x–5.1.x → peer: vite ^4||^5||^6||^7 ❌
- **5.2.0+ → peer: vite ^4||^5||^6||^7||^8 ✅**

### 2. Добавить скрипт `build:demo` в корневой `package.json`

Поскольку `deploy-demo.yml` запускает `npm run build:demo` из корня, нужно добавить скрипт, который делегирует во `frontend`:

```json
"build:demo": "cd frontend && npm run build:demo"
```

Альтернатива — изменить workflow, чтобы он сам делал `cd frontend && npm run build:demo`, но добавление скрипта в root соответствует паттерну уже существующих скриптов `dev` и `build`.

### 3. Обновить `package-lock.json` в корне

После изменения `package.json` нужно запустить:

```bash
npm install
```

в корне проекта, чтобы `package-lock.json` обновился. Без этого в CI `npm ci` (или `npm install` с кешем) может продолжать разрешать старую версию.

### 4. Проверить демо-конфиг

Убедиться, что `frontend/vite.config.demo.ts` корректно использует `@vitejs/plugin-react` — API плагина между 4.x и 5.x не менялся, поэтому дополнительных изменений не требуется.

## Что явно НЕ нужно делать

- Менять `vite` с 8 на 5 (пользователь выбрал путь обновления плагина, а не понижения vite).
- Трогать `frontend/package.json` (там уже `vite@^5.4` и `@vitejs/plugin-react@^4.3`, что совместимо между собой; эти зависимости отдельные от корневых).
- Менять `deploy-demo.yml` (достаточно добавить скрипт в root package.json).

## Проверка (QA)

1. **`npm install` в корне** — должен завершиться без ошибок `ERESOLVE`.
2. **`npm run build:demo` из корня** — должен делегировать во frontend и завершиться успешно (собирает демо в `../demo-dist`).
3. **Проверка в CI** — запушить в `main` и убедиться, что workflow `Deploy Demo to GitHub Pages` проходит шаг `Install dependencies` без ошибок.

## Параллельность / Волны

Это тривиальная задача из одной волны:

- **Wave 1:**
  1. Обновить `package.json` (plugin-react → ^5.2.0 + добавить скрипт `build:demo`).
  2. Перегенерировать `package-lock.json` (`npm install`).
  3. Проверить локально (`npm install` и `npm run build:demo`).
  4. Закоммитить и запушить.

## Приёмочные критерии

- [ ] `npm install` в корневой директории выполняется успешно (`exit code 0`).
- [ ] `npm run build:demo` в корневой директории выполняется успешно и создаёт директорию `demo-dist`.
- [ ] GitHub Actions workflow `Deploy Demo to GitHub Pages` проходит шаг `Install dependencies` без ошибок `ERESOLVE`.
