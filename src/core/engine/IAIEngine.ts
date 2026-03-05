import type { SessionId, ModelId, IMessage, StreamChunk } from '../types';
import type { AgentRunOptions, AgentStep } from '../ports/IAgentRunner';

// ─── AI Engine (Core Orchestrator) ───────────────────────────────────────────

export interface SendMessageOptions {
  sessionId: SessionId;
  message: IMessage;
  signal: AbortSignal;
}

export interface IAIEngine {
  // 普通对话（流式）
  sendMessage(options: SendMessageOptions): AsyncIterable<StreamChunk>;

  // Agent 模式（多步推理 + Tool Calling）
  runAgent(options: AgentRunOptions): AsyncIterable<AgentStep>;

  // 中断当前生成
  abort(sessionId: SessionId): void;

  // 模型切换
  switchModel(sessionId: SessionId, modelId: ModelId): void;

  // 获取当前会话状态
  getSessionStatus(sessionId: SessionId): import('../session/ISession').SessionStatus;
}
