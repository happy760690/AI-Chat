/**
 * @module store
 * @layer store
 *
 * Zustand Store 的类型定义，按职责拆分为独立 Slice。
 *
 * 职责：
 *   - SessionSlice：会话列表与当前激活会话的状态管理
 *   - MessageSlice：消息树的读写，包含流式 delta 追加与分支操作
 *   - StreamSlice：AbortController 生命周期管理，支持可中断生成
 *   - RootStore：三个 Slice 的组合类型，供 useStore hook 使用
 *
 * 约束：
 *   - 只依赖 core/types、core/session、core/message，不依赖 UI 组件
 *   - Store 不持有任何异步逻辑，异步操作由 core/engine 发起后写入 store
 *   - 每个 Slice 职责单一，避免跨 Slice 直接调用
 *
 * 依赖方向：store → core（单向）
 */

import type { SessionId, ModelId, StreamStatus } from '../core/types';
import type { ISession } from '../core/session/ISession';
import type { IMessage, IMessageTree } from '../core/message/IMessage';

// ─── Session Store Slice ──────────────────────────────────────────────────────

export interface SessionSlice {
  sessions: Map<SessionId, ISession>;
  activeSessionId: SessionId | null;
  setActiveSession(id: SessionId): void;
  createSession(modelId: ModelId): ISession;
  deleteSession(id: SessionId): void;
  updateSession(id: SessionId, patch: Partial<ISession>): void;
}

// ─── Message Store Slice ──────────────────────────────────────────────────────

export interface MessageSlice {
  trees: Map<SessionId, IMessageTree>;
  appendMessage(sessionId: SessionId, message: IMessage): void;
  updateStreamStatus(sessionId: SessionId, messageId: string, status: StreamStatus): void;
  appendDelta(sessionId: SessionId, messageId: string, delta: string): void;
  branchFrom(sessionId: SessionId, nodeId: string, message: IMessage): void;
  setActivePath(sessionId: SessionId, nodeId: string): void;
}

// ─── Stream Store Slice ───────────────────────────────────────────────────────

export interface StreamSlice {
  controllers: Map<SessionId, AbortController>;
  createController(sessionId: SessionId): AbortController;
  abort(sessionId: SessionId): void;
  cleanup(sessionId: SessionId): void;
}

// ─── Root Store ───────────────────────────────────────────────────────────────

export type RootStore = SessionSlice & MessageSlice & StreamSlice;
