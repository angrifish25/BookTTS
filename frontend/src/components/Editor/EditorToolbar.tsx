import { useCallback } from 'react';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, 
  List, ListOrdered, CheckSquare, Quote, Code, Table, 
  Undo, Redo, Minus
} from 'lucide-react';
import type { UseEditorReturn } from '@milkdown/react';
import { wrapInHeading, turnIntoText, toggleStrong, toggleEmphasis, toggleStrikethrough } from '@milkdown/preset-commonmark';
import { wrapInOrderedList, wrapInBulletList, toggleTaskList } from '@milkdown/preset-gfm';
import { wrapInBlockquote } from '@milkdown/preset-commonmark';
import { insertTable } from '@milkdown/preset-gfm';
import { undo, redo } from '@milkdown/plugin-history';

interface EditorToolbarProps {
  editor: UseEditorReturn;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const runCommand = useCallback((fn: (ctx: any) => void) => {
    const editorInstance = editor.get();
    if (!editorInstance) return;
    editorInstance.action(fn);
  }, [editor]);

  const toolbarGroups = [
    {
      items: [
        { icon: Undo, title: '\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c', action: () => runCommand(undo) },
        { icon: Redo, title: '\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c', action: () => runCommand(redo) },
      ]
    },
    {
      items: [
        { icon: Bold, title: '\u0416\u0438\u0440\u043d\u044b\u0439', action: () => runCommand(toggleStrong) },
        { icon: Italic, title: '\u041a\u0443\u0440\u0441\u0438\u0432', action: () => runCommand(toggleEmphasis) },
        { icon: Strikethrough, title: '\u0417\u0430\u0447\u0451\u0440\u043a\u043d\u0443\u0442\u044b\u0439', action: () => runCommand(toggleStrikethrough) },
      ]
    },
    {
      items: [
        { icon: Heading1, title: '\u0417\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a 1', action: () => runCommand(wrapInHeading(1)) },
        { icon: Heading2, title: '\u0417\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a 2', action: () => runCommand(wrapInHeading(2)) },
        { icon: Heading3, title: '\u0417\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a 3', action: () => runCommand(wrapInHeading(3)) },
      ]
    },
    {
      items: [
        { icon: List, title: '\u041c\u0430\u0440\u043a\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u0441\u043f\u0438\u0441\u043e\u043a', action: () => runCommand(wrapInBulletList) },
        { icon: ListOrdered, title: '\u041d\u0443\u043c\u0435\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u0441\u043f\u0438\u0441\u043e\u043a', action: () => runCommand(wrapInOrderedList) },
        { icon: CheckSquare, title: '\u0421\u043f\u0438\u0441\u043e\u043a \u0437\u0430\u0434\u0430\u0447', action: () => runCommand(toggleTaskList) },
      ]
    },
    {
      items: [
        { icon: Quote, title: '\u0426\u0438\u0442\u0430\u0442\u0430', action: () => runCommand(wrapInBlockquote) },
        { icon: Code, title: '\u041a\u043e\u0434', action: () => runCommand(turnIntoText) },
        { icon: Table, title: '\u0422\u0430\u0431\u043b\u0438\u0446\u0430', action: () => runCommand(insertTable) },
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
