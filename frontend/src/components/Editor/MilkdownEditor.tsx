import { useEffect, useRef, useCallback } from 'react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { nord } from '@milkdown/theme-nord';
import { useEditor, Milkdown } from '@milkdown/react';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';
import { cursor } from '@milkdown/plugin-cursor';
import { prism } from '@milkdown/plugin-prism';
import { tooltip } from '@milkdown/plugin-tooltip';
import { slash } from '@milkdown/plugin-slash';
import { emoji } from '@milkdown/plugin-emoji';
import { math } from '@milkdown/plugin-math';
import { block } from '@milkdown/plugin-block';
import { clipboard } from '@milkdown/plugin-clipboard';
import { useAppStore } from '@/store/useAppStore';
import { EditorToolbar } from './EditorToolbar';

import 'katex/dist/katex.min.css';

export function MilkdownEditor() {
  const activeDocumentId = useAppStore((s) => s.activeDocumentId);
  const documents = useAppStore((s) => s.documents);
  const updateDocument = useAppStore((s) => s.updateDocument);
  const setEditorContent = useAppStore((s) => s.setEditorContent);
  
  const activeDoc = documents.find((d) => d.id === activeDocumentId);
  const content = activeDoc?.content || '# \u041d\u043e\u0432\u044b\u0439 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\n\n\u041d\u0430\u0447\u043d\u0438\u0442\u0435 \u043f\u0438\u0441\u0430\u0442\u044c...';

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
        ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
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
      .use(tooltip)
      .use(slash)
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
