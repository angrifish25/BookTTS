import { FileText, Plus, Trash2, Volume2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function Sidebar() {
  const documents = useAppStore((s) => s.documents);
  const activeDocumentId = useAppStore((s) => s.activeDocumentId);
  const setActiveDocument = useAppStore((s) => s.setActiveDocument);
  const removeDocument = useAppStore((s) => s.removeDocument);
  const voices = useAppStore((s) => s.voices);
  const activeVoiceId = useAppStore((s) => s.activeVoiceId);

  return (
    <aside className="w-64 bg-white border-r border-surface-200 flex flex-col shrink-0">
      <div className="p-4 border-b border-surface-200">
        <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Документы</h3>
        <button className="btn-secondary w-full text-xs">
          <Plus size={14} />
          Новый документ
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {documents.length === 0 ? (
          <div className="text-center text-sm text-surface-400 py-8">
            Нет документов
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setActiveDocument(doc.id)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm ${
                  activeDocumentId === doc.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-surface-700 hover:bg-surface-100'
                }`}
              >
                <FileText size={16} className="shrink-0" />
                <span className="truncate flex-1">{doc.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDocument(doc.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 hover:text-red-600 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-surface-200">
        <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Активный голос</h3>
        <div className="flex items-center gap-2 text-sm text-surface-700">
          <Volume2 size={16} className="text-primary-600" />
          <span className="truncate">
            {voices.find((v) => v.id === activeVoiceId)?.name || 'Не выбран'}
          </span>
        </div>
      </div>
    </aside>
  );
}