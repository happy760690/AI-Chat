/**
 * @module presentation/components/MessageBubble
 * @layer presentation
 *
 * 单条消息气泡，支持文本、tool_call、tool_result 渲染。
 * 流式状态显示光标动画，分叉按钮支持消息树分支。
 */

import { ToolCallBadge } from './ToolCallBadge';
import type { IMessage } from '../../core/message/IMessage';
import type { ToolCallContent, ToolResultContent } from '../../core/types';

interface Props {
  message: IMessage;
  onBranch?: (nodeId: string) => void;
}

export function MessageBubble({ message, onBranch }: Props) {
  const isUser = message.role === 'user';
  const isStreaming = message.streamStatus === 'streaming';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 group`}>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>

        {/* role label */}
        <span className="text-xs text-gray-500 mb-1 px-1">
          {message.role === 'tool' ? '🔧 tool' : isUser ? '你' : '助手'}
        </span>

        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : message.role === 'tool'
            ? 'bg-transparent p-0'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm'
        }`}>
          {message.content.map((c, i) => {
            if (c.type === 'text') {
              return (
                <span key={i} className="whitespace-pre-wrap break-words">
                  {c.text}
                  {isStreaming && i === message.content.length - 1 && (
                    <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse align-middle" />
                  )}
                </span>
              );
            }
            if (c.type === 'tool_call' || c.type === 'tool_result') {
              return (
                <ToolCallBadge
                  key={i}
                  content={c as ToolCallContent | ToolResultContent}
                />
              );
            }
            return null;
          })}

          {/* aborted indicator */}
          {message.streamStatus === 'aborted' && (
            <span className="text-xs text-gray-500 ml-1">[已中断]</span>
          )}
        </div>

        {/* branch button */}
        {onBranch && !isStreaming && (
          <button
            onClick={() => onBranch(message.nodeId)}
            className="opacity-0 group-hover:opacity-100 mt-1 text-xs text-gray-600 hover:text-blue-400 transition-opacity px-1"
          >
            ⎇ 从此分叉
          </button>
        )}
      </div>
    </div>
  );
}
