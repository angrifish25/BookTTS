import { useCallback } from 'react';
import type { $Command } from '@milkdown/utils';
import { commandsCtx } from '@milkdown/core';
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Table,
  Undo, Redo
} from 'lucide-react';
import type { UseEditorReturn } from '@milkdown/react';
import {
  wrapInHeadingCommand, turnIntoTextCommand, toggleStrongCommand,
  toggleEmphasisCommand, wrapInBulletListCommand, wrapInOrderedListCommand,
  wrapInBlockquoteCommand
} from '@milkdown/preset-commonmark';
import {
  toggleStrikethroughCommand, insertTableCommand
} from '@milkdown/preset-gfm';
import { undoCommand, redoCommand } from '@milkdown/plugin-history';

interface EditorToolbarProps {
  editor: UseEditorReturn;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const runCommandWithPayload = useCallback(<T,>(cmd: $Command<T>, payload?: T) => {
    const editorInstance = editor.get();
    if (!editorInstance) return;
    editorInstance.action((ctx) => {
      ctx.get(commandsCtx).call(cmd.key, payload);
    });
  }, [editor]);

  const toolbarGroups = [
    {
      items: [
        { icon: Undo, title: 'Отменить', action: () => runCommandWithPayload(undoCommand) },
        { icon: Redo, title: 'Повторить', action: () => runCommandWithPayload(redoCommand) },
      ]
    },
    {
      items: [
        { icon: Bold, title: 'Жирный', action: () => runCommandWithPayload(toggleStrongCommand) },
        { icon: Italic, title: 'Курсив', action: () => runCommandWithPayload(toggleEmphasisCommand) },
        { icon: Strikethrough, title: 'Зачёркнутый', action: () => runCommandWithPayload(toggleStrikethroughCommand) },
      ]
    },
    {
      items: [
        { icon: Heading1, title: 'Заголовок 1', action: () => runCommandWithPayload(wrapInHeadingCommand, 1) },
        { icon: Heading2, title: 'Заголовок 2', action: () => runCommandWithPayload(wrapInHeadingCommand, 2) },
        { icon: Heading3, title: 'Заголовок 3', action: () => runCommandWithPayload(wrapInHeadingCommand, 3) },
      ]
    },
    {
      items: [
        { icon: List, title: 'Маркированный список', action: () => runCommandWithPayload(wrapInBulletListCommand) },
        { icon: ListOrdered, title: 'Нумерованный список', action: () => runCommandWithPayload(wrapInOrderedListCommand) },
      ]
    },
    {
      items: [
        { icon: Quote, title: 'Цитата', action: () => runCommandWithPayload(wrapInBlockquoteCommand) },
        { icon: Code, title: 'Код', action: () => runCommandWithPayload(turnIntoTextCommand) },
        { icon: Table, title: 'Таблица', action: () => runCommandWithPayload(insertTableCommand, { row: 3, col: 3 }) },
      ]
    },
  ];

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-surface-200 bg-white overflow-x-auto">
      {toolbarGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-center gap-0.5">
          {group.items.map((item, itemIndex) => (
            <button
              key={itemIndex}
              onClick={item.action}
              title={item.title}
              className="p-1.5 rounded hover:bg-surface-100 text-surface-600 transition-colors"
            >
              <item.icon size={16} />
            </button>
          ))}
          {groupIndex < toolbarGroups.length - 1 && (
            <div className="w-px h-5 bg-surface-200 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}
