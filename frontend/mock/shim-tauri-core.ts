/** Mock @tauri-apps/api/core — covers invoke() used by src/api/tauri.ts */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function invoke(_cmd: string, _args?: Record<string, unknown>): Promise<unknown> {
  console.warn('[TAURI SHIM] invoke called but not implemented');
  return Promise.reject(new Error('Tauri invoke is mocked — real API unavailable in browser'));
}
