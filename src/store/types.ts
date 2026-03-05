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
