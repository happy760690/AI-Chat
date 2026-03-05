/**
 * @module agent/AgentRunner
 * @layer agent
 *
 * Agent 循环执行器，实现 ReAct 模式（Reasoning + Acting）。
 *
 * 执行流程：
 *   1. 将用户输入 + 历史消息发送给模型（LLM step）
 *   2. 若模型返回 tool_call，执行工具并将结果回传（tool_call + tool_result step）
 *   3. 将工具结果追加到上下文，继续下一轮模型调用
 *   4. 直到模型不再调用工具，或达到 maxSteps，或收到 abort 信号
 *
 * 职责：
 *   - 管理多轮对话上下文（messages 数组）
 *   - 通过 AsyncIterable<AgentStep> 逐步输出每一步结果
 *   - 响应 AbortSignal，中断后 yield aborted 步骤
 *
 * 约束：
 *   - 只依赖 core/ports，不依赖 AIEngine / store / UI
 *   - IModelAdapter 和 ToolExecutor 通过构造函数注入
 *   - 可单元测试：所有依赖均可 mock
 *
 * 依赖方向：agent → core（单向）
 */

import type { AgentId, SessionId, MessageId, NodeId } from '../core/types';
import type { IAgentRunner, AgentRunOptions, AgentStep } from '../core/ports/IAgentRunner';
import type { IModelAdapter } from '../core/ports/IModelAdapter';
import type { IMessage } from '../core/message/IMessage';
import type { ModelConfig } from '../core/types';
import { ToolExecutor } from '../tools/ToolExecutor';

const DEFAULT_MAX_STEPS = 10;

export interface AgentRunnerOptions {
  agentId: AgentId;
  modelAdapter: IModelAdapter;
  toolExecutor: ToolExecutor;
  modelConfig: ModelConfig;
}

export class AgentRunner implements IAgentRunner {
  readonly agentId: AgentId;

  private readonly modelAdapter: IModelAdapter;
  private readonly toolExecutor: ToolExecutor;
  private readonly modelConfig: ModelConfig;

  constructor(opts: AgentRunnerOptions) {
    this.agentId = opts.agentId;
    this.modelAdapter = opts.modelAdapter;
    this.toolExecutor = opts.toolExecutor;
    this.modelConfig = opts.modelConfig;
  }

  async *run(options: AgentRunOptions): AsyncIterable<AgentStep> {
    const { sessionId, input, signal, maxSteps = DEFAULT_MAX_STEPS } = options;
    const messages: IMessage[] = [input];
    let stepIndex = 0;

    while (stepIndex < maxSteps) {
      if (signal.aborted) {
        yield this.makeStep(stepIndex, 'llm', this.makeAbortedMessage(sessionId), input.nodeId);
        return;
      }

      // ── LLM 调用 ────────────────────────────────────────────────────────────
      const assistantMessage = await this.collectLLMResponse(
        messages, sessionId, input.nodeId, signal
      );

      yield this.makeStep(stepIndex++, 'llm', assistantMessage, input.nodeId);
      messages.push(assistantMessage);

      if (signal.aborted) return;

      // ── 检查是否有 tool_call ─────────────────────────────────────────────────
      const toolCalls = this.toolExecutor.parseToolCalls(assistantMessage);
      if (toolCalls.length === 0) return; // 模型不再调用工具，结束

      // ── 执行工具 ─────────────────────────────────────────────────────────────
      for (const call of toolCalls) {
        yield this.makeStep(
          stepIndex++,
          'tool_call',
          this.makeToolCallMessage(call.callId, call.toolId, sessionId, assistantMessage.nodeId),
          assistantMessage.nodeId
        );
      }

      const results = await this.toolExecutor.executeAll(assistantMessage, signal);
      const resultMessage = this.toolExecutor.buildResultMessage(
        results, sessionId, assistantMessage.nodeId
      );

      yield this.makeStep(stepIndex++, 'tool_result', resultMessage, assistantMessage.nodeId);
      messages.push(resultMessage);
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async collectLLMResponse(
    messages: IMessage[],
    sessionId: SessionId,
    parentNodeId: NodeId,
    signal: AbortSignal
  ): Promise<IMessage> {
    let text = '';
    const source = this.modelAdapter.chat(messages, this.modelConfig, signal);
    for await (const chunk of source) {
      if (signal.aborted) break;
      text += chunk.delta;
    }

    return {
      id: `agent-llm-${Date.now()}` as MessageId,
      nodeId: `agent-llm-node-${Date.now()}` as NodeId,
      parentNodeId,
      sessionId,
      role: 'assistant',
      content: [{ type: 'text', text }],
      createdAt: Date.now(),
      streamStatus: signal.aborted ? 'aborted' : 'done',
    };
  }

  private makeStep(
    index: number,
    type: AgentStep['type'],
    message: IMessage,
    _parentNodeId: NodeId
  ): AgentStep {
    return { index, type, message, timestamp: Date.now() };
  }

  private makeAbortedMessage(sessionId: SessionId): IMessage {
    return {
      id: `agent-aborted-${Date.now()}` as MessageId,
      nodeId: `agent-aborted-node-${Date.now()}` as NodeId,
      parentNodeId: null,
      sessionId,
      role: 'assistant',
      content: [{ type: 'text', text: '' }],
      createdAt: Date.now(),
      streamStatus: 'aborted',
    };
  }

  private makeToolCallMessage(
    callId: string,
    toolId: string,
    sessionId: SessionId,
    parentNodeId: NodeId
  ): IMessage {
    return {
      id: `agent-tool-call-${callId}` as MessageId,
      nodeId: `agent-tool-call-node-${callId}` as NodeId,
      parentNodeId,
      sessionId,
      role: 'assistant',
      content: [{ type: 'tool_call', toolId, callId, input: {} }],
      createdAt: Date.now(),
      streamStatus: 'done',
    };
  }
}
