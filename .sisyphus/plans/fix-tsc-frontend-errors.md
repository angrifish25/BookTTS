# Fix TypeScript Errors (tsc --noEmit) in frontend/

## TL;DR
> **Summary**: `tsc --noEmit` currently reports 9 errors across 4 files in `frontend/src/` related to Milkdown API misuse and unused identifiers. Need to fix API calls, remove duplicate imports, and clean dead code.
> **Deliverables**: Zero TypeScript errors on `npx tsc --noEmit --project ./frontend/tsconfig.json`
> **Effort**: Medium
> **Parallel**: YES - 4 independent tasks
> **Critical Path**: Fix all errors in any order → Re-run tsc to verify

## Context
### Original Request
User asks to fix all `tsc --noEmit` errors in `frontend/`. This is a QA gate enforced by `AGENTS.md` (every commit must pass `tsc --noEmit`).

## Work Objectives
### Core Objective
Eliminate all TypeScript errors reported by `tsc --noEmit` for the frontend directory.

### Deliverables
- `frontend/src/components/Editor/EditorToolbar.tsx` — Fix `wrapInHeadingCommand` and `insertTableCommand` argument types.
- `frontend/src/components/Editor/MilkdownEditor.tsx` — Remove duplicate `prism` import and fix missing `tooltip`, `slash` plugins.
- `frontend/src/components/Voice/VoiceCloner.tsx` — Remove unused `Play` import.
- `frontend/src/components/Voice/VoiceSettings.tsx` — Remove unused `useTTS` import.

### Definition of Done
Running `npx tsc --noEmit --project ./frontend/tsconfig.json` from repo root produces zero errors.

### Must Have
- All 9 reported errors resolved.
- The app still compiles/runs successfully after fixes.
- No new TypeScript warnings introduced.

### Must NOT Have
- No functional changes to app behavior beyond fixing TS errors.
- No removal of imports that are actually used.
- No disabling of `strict` checks or related compiler options.

## Execution Strategy
### Parallel Execution Waves
> Tasks are independent and can run in parallel.

Wave 1: Fix Milkdown editor errors (Milkdown API misuse)
Wave 2: Fix unused identifier errors (simple cleanup)

## TODOs
- [ ] 1. Fix `EditorToolbar.tsx` — Milkdown command API misuse

  **What to do**:
  - Lines 45-47: Wrap `wrapInHeadingCommand(level)` calls inside arrow functions passed to `runCommand`. The command factory returns a function, not an action. Change:
    ```ts
    runCommand(wrapInHeadingCommand(1))
    ```
    to:
    ```ts
    runCommand(() => wrapInHeadingCommand(1))
    ```
    Do the same for levels 2 and 3.
  - Line 61: Fix `insertTableCommand({ row: 3, col: 3 })`. The Milkdown `insertTableCommand` expects a context object, but `row` is not a valid key—use `rows` (plural). However, the safest fix is to execute it via `runCommand` where the editor injects the `Ctx` context:
    ```ts
    action: () => runCommand(() => insertTableCommand({ rows: 3, cols: 3 }))
    ```
    If `insertTableCommand` accepts rows and cols via Ctx, another valid form might be `(ctx) => insertTableCommand(ctx, { ... })`. We must inspect the actual API to determine this. **CRITICAL DECISION**: Check `@milkdown/preset-gfm` type for `insertTableCommand`. If it takes a config object with `rows` and `cols` directly, use that. If it requires a Ctx first, wrap it in `runCommand` with an arrow that receives `ctx`.

  **Must NOT do**: Disable strict checks, change `tsconfig.json`, or ignore errors with `@ts-ignore`.

  **Acceptance Criteria**:
  - [ ] `tsc --noEmit` no longer reports TS2345 for `wrapInHeadingCommand` calls.
  - [ ] `tsc --noEmit` no longer reports TS2353 for `insertTableCommand`.

  **Commit**: YES | Message: `fix(frontend): correct milkdown heading and table command signatures` | Files: `frontend/src/components/Editor/EditorToolbar.tsx`

- [ ] 2. Fix `MilkdownEditor.tsx` — Duplicate import + missing plugins

  **What to do**:
  - Lines 10-11: Remove duplicate `import { prism } from '@milkdown/plugin-prism';`.
  - Lines 59-60: `tooltip` and `slash` are used but never imported. Check if `@milkdown/plugin-tooltip` and `@milkdown/plugin-slash` are installed. If yes, import them at the top of the file:
    ```ts
    import { tooltip } from '@milkdown/plugin-tooltip';
    import { slash } from '@milkdown/plugin-slash';
    ```
    If those packages are NOT installed, add them:
    ```
    npm install @milkdown/plugin-tooltip @milkdown/plugin-slash
    ```
    (Run from `frontend/` directory).

  **Acceptance Criteria**:
  - [ ] Duplicate import removed.
  - [ ] `tooltip` and `slash` are imported and resolved.
  - [ ] `tsc --noEmit` reports zero errors for this file.

  **Commit**: YES | Message: `fix(frontend): resolve milkdown plugin imports in editor` | Files: `frontend/src/components/Editor/MilkdownEditor.tsx`, `frontend/package.json`, `frontend/package-lock.json`

- [ ] 3. Remove unused `Play` import in `VoiceCloner.tsx`

  **What to do**:
  - Line 2: Remove `Play` from the `lucide-react` import since it is not used anywhere in the component.

  **Acceptance Criteria**:
  - [ ] `tsc --noEmit` no longer reports TS6133 for `Play`. File still compiles.

  **Commit**: YES | Message: `fix(frontend): remove unused Play icon import from VoiceCloner` | Files: `frontend/src/components/Voice/VoiceCloner.tsx`

- [ ] 4. Remove unused `useTTS` import in `VoiceSettings.tsx`

  **What to do**:
  - Line 3: Remove `import { useTTS } from '@/hooks/useTTS';` since the hook is never invoked or referenced in this component.

  **Acceptance Criteria**:
  - [ ] `tsc --noEmit` no longer reports TS6133 for `useTTS`. File still compiles.

  **Commit**: YES | Message: `fix(frontend): remove unused useTTS hook import from VoiceSettings` | Files: `frontend/src/components/Voice/VoiceSettings.tsx`

## Final Verification Wave
- [ ] V1. Re-run TypeScript check — Run `npx tsc --noEmit --project ./frontend/tsconfig.json` and confirm zero errors.

## Commit Strategy
Make 4 separate atomic commits (one per fix) or a single commit if preferred by the user.

## Success Criteria
`tsc --noEmit` reports zero errors for `frontend/tsconfig.json`.
