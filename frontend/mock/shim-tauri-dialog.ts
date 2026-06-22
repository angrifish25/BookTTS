/** Mock @tauri-apps/plugin-dialog — covers open() used by src/hooks/useTauri.ts */

export function _open(
  options?: { multiple?: boolean; filters?: Array<{ name: string; extensions: string[] }> }
): Promise<string | string[]> {
  const useMultiple = options?.multiple ?? false;

  return new Promise((resolve) => {
    resolve(useMultiple ? [] : '');
  });
}

// Aliases so both named forms import correctly
export const open = _open;
