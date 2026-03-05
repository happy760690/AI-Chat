/**
 * @module core/engine
 * @layer core
 *
 * AI 引擎核心编排器接口（Orchestrator）。
 *
 * 职责：
 *   - 统一入口：普通对话（sendMessage）与 Agent 模式（runAgent）
 *   - 管理每个 Session 的生命周期：流式生成、中断、模型切换
 *   - 不持有任何状态，所有状态通过 Repository / Store 管理
 *
 * 约束：
 *   - 只依赖 core/types 和 core/ports，不依赖 UI / store / infrastructure
 *   - 所有副作用（SSE、HTTP）必须通过 IModelAdapter 或 IAgentRunner 委托
 *   - abort() 必须幂等，对已结束的 session 调用不得抛出异常
 */

import type { SessionId, ModelId, StreamChunk } from '../types';
import type { AgentRunOptions, AgentStep } from '../ports/IAgentRunner';
import type { IMessage } from '../message/IMessage';

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
