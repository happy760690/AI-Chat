/**
 * @module core/ports/IAgentRunner
 * @layer core (port)
 *
 * Agent 运行器端口，定义多步推理的执行协议。
 *
 * 职责：
 *   - IAgentRunner：单个 Agent 的执行接口，通过 AsyncIterable<AgentStep> 逐步输出
 *   - AgentStep：每一步的类型（llm / tool_call / tool_result / rag）及对应消息
 *   - AgentRunOptions：运行参数，包含 maxSteps 防止无限循环
 *
 * 约束：
 *   - 只依赖 core/types，不依赖具体 LLM SDK 或工具实现
 *   - run() 必须响应 signal.abort()，中断后 yield 最后一个 aborted 状态步骤
 *   - maxSteps 默认值由实现层决定，建议不超过 20
 */

import type { SessionId, AgentId } from '../types';
import type { IMessage } from '../message/IMessage';

// ─── Agent Runner Port ────────────────────────────────────────────────────────

export type AgentStatus = 'idle' | 'thinking' | 'calling_tool' | 'done' | 'error' | 'aborted';

export interface AgentStep {
  index: number;
  type: 'llm' | 'tool_call' | 'tool_result' | 'rag';
  message: IMessage;
  timestamp: number;
}

export interface AgentRunOptions {
  sessionId: SessionId;
  agentId: AgentId;
  input: IMessage;
  signal: AbortSignal;
  maxSteps?: number;
}

export interface AgentRunResult {
  steps: AgentStep[];
  finalMessage: IMessage;
  status: AgentStatus;
}

export interface IAgentRunner {
  readonly agentId: AgentId;
  run(options: AgentRunOptions): AsyncIterable<AgentStep>;
}
