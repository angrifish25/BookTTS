import { Upload } from 'lucide-react';
import { useFileImport } from '@/hooks/useTauri';

export function FileImport() {
  const { importFile } = useFileImport();

  return (
    <button
      onClick={importFile}
      className="btn-ghost text-xs"
      title="Импортировать документ"
    >
      <Upload size={14} />
      Импорт
    </button>
  );
}