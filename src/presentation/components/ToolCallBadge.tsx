/**
 * @module presentation/components/ToolCallBadge
 * @layer presentation
 *
 * 工具调用可视化组件，展示 tool_call 和 tool_result 内容。
 */

import type { ToolCallContent, ToolResultContent } from '../../core/types';

interface Props {
  content: ToolCallContent | ToolResultContent;
}

export function ToolCallBadge({ content }: Props) {
  if (content.type === 'tool_call') {
    return (
      <div className="my-1 px-3 py-2 bg-yellow-900/40 border border-yellow-700/50 rounded text-xs font-mono">
        <span className="text-yellow-400 font-semibold">⚙ tool_call</span>
        <span className="text-gray-400 ml-2">{content.toolId}</span>
        <pre className="mt-1 text-gray-300 whitespace-pre-wrap break-all">
          {JSON.stringify(content.input, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className={`my-1 px-3 py-2 rounded text-xs font-mono border ${
      content.isError
        ? 'bg-red-900/40 border-red-700/50'
        : 'bg-green-900/40 border-green-700/50'
    }`}>
      <span className={content.isError ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
        {content.isError ? '✗ tool_error' : '✓ tool_result'}
      </span>
      <pre className="mt-1 text-gray-300 whitespace-pre-wrap break-all">
        {typeof content.output === 'string'
          ? content.output
          : JSON.stringify(content.output, null, 2)}
      </pre>
    </div>
  );
}
