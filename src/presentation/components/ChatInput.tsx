/**
 * @module presentation/components/ChatInput
 * @layer presentation
 *
 * 消息输入框，支持 Enter 发送、Shift+Enter 换行、中断按钮。
 */

import { useState, useRef, useCallback } from 'react';

interface Props {
  onSend: (text: string) => void;
  onAbort: () => void;
  isStreaming: boolean;
}

export function ChatInput({ onSend, onAbort, isStreaming }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!text.trim() || isStreaming) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [text, isStreaming, onSend]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  return (
    <div className="flex items-end gap-2 p-3 border-t border-gray-700 bg-gray-900">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        rows={1}
        className="flex-1 resize-none bg-gray-800 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 max-h-40 overflow-y-auto"
      />

      {isStreaming ? (
        <button
          onClick={onAbort}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-colors shrink-0"
        >
          ■ 停止
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors shrink-0"
        >
          发送
        </button>
      )}
    </div>
  );
}
