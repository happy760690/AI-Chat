/**
 * @module presentation/components/ChatWindow
 * @layer presentation
 *
 * 主聊天窗口，渲染消息列表、输入框、模型选择器。
 * 支持消息树分叉操作。
 */

import { useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ModelSelector } from './ModelSelector';
import type { SessionId } from '../../core/types';

interface Props {
  sessionId: SessionId;
}

export function ChatWindow({ sessionId }: Props) {
  const messages    = useStore(s => s.getActivePath(sessionId));
  const session     = useStore(s => s.sessions.get(sessionId));
  const branchFrom  = useStore(s => s.branchFrom);
  const bottomRef   = useRef<HTMLDivElement>(null);

  const { sendMessage, abort, isStreaming } = useChat(sessionId);

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  function handleBranch(nodeId: string) {
    const branchMsg = {
      id: `branch-${Date.now()}`,
      nodeId: `branch-node-${Date.now()}`,
      parentNodeId: nodeId,
      sessionId,
      role: 'user' as const,
      content: [{ type: 'text' as const, text: '' }],
      createdAt: Date.now(),
      streamStatus: 'idle' as const,
    };
    branchFrom(sessionId, nodeId, branchMsg);
  }

  if (!session) return null;

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">{session.title}</span>
          {isStreaming && (
            <span className="text-xs text-blue-400 animate-pulse">生成中...</span>
          )}
        </div>
        <ModelSelector sessionId={sessionId} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            发送消息开始对话
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.nodeId}
              message={msg}
              onBranch={msg.role === 'assistant' ? handleBranch : undefined}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onAbort={abort}
        isStreaming={isStreaming}
      />
    </div>
  );
}
