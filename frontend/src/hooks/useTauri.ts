import { useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { importDocument, getSystemInfo, loadSettings, saveSettings } from '@/api/tauri';
import { useAppStore } from '@/store/useAppStore';

export function useFileImport() {
  const addDocument = useAppStore((s) => s.addDocument);
  const setActiveDocument = useAppStore((s) => s.setActiveDocument);

  const importFile = useCallback(async () => {
    const selected = await open({
      multiple: false,
      filters: [
        { name: 'Documents', extensions: ['txt', 'md', 'docx', 'pdf', 'fb2', 'epub'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (!selected) return;
    const path = Array.isArray(selected) ? selected[0] : selected;
    const doc = await importDocument(path);
    addDocument(doc);
    setActiveDocument(doc.id);
  }, [addDocument, setActiveDocument]);

  return { importFile };
}

export function useSystemInfo() {
  const setSystemInfo = useAppStore((s) => s.setSystemInfo);

  const fetchSystemInfo = useCallback(async () => {
    const info = await getSystemInfo();
    setSystemInfo(info);
  }, [setSystemInfo]);

  return { fetchSystemInfo };
}

export function useAppSettings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const load = useCallback(async () => {
    const s = await loadSettings();
    updateSettings(s);
  }, [updateSettings]);

  const save = useCallback(async () => {
    await saveSettings(settings);
  }, [settings]);

  return { settings, updateSettings, load, save };
}