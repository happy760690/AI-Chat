/**
 * @module tools/ToolExecutor
 * @layer tools
 *
 * Tool 执行器，负责解析 LLM 返回的 tool_call 内容并执行对应工具。
 *
 * 职责：
 *   - parseToolCalls：从消息内容中提取所有 ToolCallContent
 *   - execute：通过 IToolRegistry 查找工具并执行，返回 ToolCallResult
 *   - buildResultMessage：将执行结果封装为 tool_result 消息，供回传模型
 *
 * 约束：
 *   - 只依赖 core/ports/IToolRegistry 和 core/types
 *   - 不持有工具实例，所有工具通过注入的 IToolRegistry 查找
 *   - 工具执行异常统一捕获，isError=true 回传，不向上抛出
 *   - 可单元测试：IToolRegistry 可 mock
 *
 * 依赖方向：tools → core（单向）
 */

import type { IToolRegistry, ToolCallResult } from '../core/ports/IToolRegistry';
import type { IMessage } from '../core/message/IMessage';
import type { ToolCallContent, ToolResultContent, SessionId } from '../core/types';

export class ToolExecutor {
  constructor(private readonly registry: IToolRegistry) {}

  /**
   * 从消息内容中提取所有 tool_call 片段。
   */
  parseToolCalls(message: IMessage): ToolCallContent[] {
    return message.content.filter(
      (c): c is ToolCallContent => c.type === 'tool_call'
    );
  }

  /**
   * 执行单个 tool_call，捕获异常并以 isError=true 返回。
   */
  async execute(
    toolCall: ToolCallContent,
    signal: AbortSignal
  ): Promise<ToolCallResult> {
    const tool = this.registry.get(toolCall.toolId);
    if (!tool) {
      return {
        callId: toolCall.callId,
        output: `Tool not found: ${toolCall.toolId}`,
        isError: true,
      };
    }

    try {
      return await tool.execute({
        callId: toolCall.callId,
        toolId: toolCall.toolId,
        input: toolCall.input,
        signal,
      });
    } catch (err) {
      return {
        callId: toolCall.callId,
        output: err instanceof Error ? err.message : String(err),
        isError: true,
      };
    }
  }

  /**
   * 并发执行消息中所有 tool_call，返回结果列表。
   */
  async executeAll(
    message: IMessage,
    signal: AbortSignal
  ): Promise<ToolCallResult[]> {
    const calls = this.parseToolCalls(message);
    return Promise.all(calls.map(c => this.execute(c, signal)));
  }

  /**
   * 将 ToolCallResult[] 封装为一条 tool_result 消息，回传给模型。
   */
  buildResultMessage(
    results: ToolCallResult[],
    sessionId: SessionId,
    parentNodeId: string
  ): IMessage {
    const contents: ToolResultContent[] = results.map(r => ({
      type: 'tool_result',
      callId: r.callId,
      output: r.output,
      isError: r.isError,
    }));

    return {
      id: `tool-result-${Date.now()}`,
      nodeId: `tool-result-node-${Date.now()}`,
      parentNodeId,
      sessionId,
      role: 'tool',
      content: contents,
      createdAt: Date.now(),
      streamStatus: 'done',
    };
  }
}
