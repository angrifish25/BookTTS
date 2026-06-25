import { useEffect, useRef, useCallback } from 'react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { nord } from '@milkdown/theme-nord';
import { useEditor, Milkdown, MilkdownProvider } from '@milkdown/react';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';
import { cursor } from '@milkdown/plugin-cursor';
import { prism } from '@milkdown/plugin-prism';
import { emoji } from '@milkdown/plugin-emoji';
import { math } from '@milkdown/plugin-math';
import { block } from '@milkdown/plugin-block';
import { clipboard } from '@milkdown/plugin-clipboard';
import { useAppStore } from '@/store/useAppStore';
import { EditorToolbar } from './EditorToolbar';

import 'katex/dist/katex.min.css';

function MilkdownEditorInner() {
  const activeDocumentId = useAppStore((s) => s.activeDocumentId);
  const documents = useAppStore((s) => s.documents);
  const updateDocument = useAppStore((s) => s.updateDocument);
  const setEditorContent = useAppStore((s) => s.setEditorContent);
  
  const activeDoc = documents.find((d) => d.id === activeDocumentId);
  const content = activeDoc?.content || '# Новый документ\n\nНачните писать...';

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleUpdate = useCallback((markdown: string) => {
    setEditorContent(markdown);
    if (activeDocumentId) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        updateDocument(activeDocumentId, { content: markdown, lastModified: new Date().toISOString() });
      }, 500);
    }
  }, [activeDocumentId, updateDocument, setEditorContent]);

  const editor = useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, content);
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown) {
            handleUpdate(markdown);
          }
        });
      })
      .config(nord)
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(cursor)
      .use(prism)
      .use(emoji)
      .use(math)
      .use(block)
      .use(clipboard)
      .use(listener);
  }, [activeDocumentId, handleUpdate]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-auto">
        <div className="milkdown">
          <Milkdown />
        </div>
      </div>
    </div>
  );
}

export function MilkdownEditor() {
  return (
    <MilkdownProvider>
      <MilkdownEditorInner />
    </MilkdownProvider>
  );
}
