/**
 * @module store/sessionSlice
 * @layer store
 *
 * 会话状态 Slice，管理会话列表与当前激活会话。
 *
 * 职责：
 *   - 创建、删除、更新会话
 *   - 维护 activeSessionId
 *   - 维护每个 session 绑定的 modelId
 *
 * 约束：
 *   - 不调用任何 core/engine，只管理纯状态
 *   - 不依赖 UI 组件
 */

import type { StateCreator } from 'zustand';
import type { SessionId, ModelId } from '../core/types';
import type { ISession, SessionStatus } from '../core/session/ISession';
import type { RootStore } from './types';

export interface SessionSlice {
  sessions: Map<SessionId, ISession>;
  activeSessionId: SessionId | null;
  setActiveSession(id: SessionId): void;
  createSession(modelId: ModelId): ISession;
  deleteSession(id: SessionId): void;
  updateSession(id: SessionId, patch: Partial<ISession>): void;
  setSessionStatus(id: SessionId, status: SessionStatus): void;
}

let sessionCounter = 0;

export const createSessionSlice: StateCreator<RootStore, [], [], SessionSlice> = (set, get) => ({
  sessions: new Map(),
  activeSessionId: null,

  setActiveSession(id) {
    set({ activeSessionId: id });
  },

  createSession(modelId) {
    const id: SessionId = `session-${++sessionCounter}-${Date.now()}`;
    const session: ISession = {
      id,
      title: `对话 ${sessionCounter}`,
      modelConfig: { modelId },
      activeNodeId: null,
      status: 'idle',
      enabledPluginIds: [],
      agentId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set(state => {
      const sessions = new Map(state.sessions);
      sessions.set(id, session);
      return { sessions, activeSessionId: id };
    });
    return session;
  },

  deleteSession(id) {
    set(state => {
      const sessions = new Map(state.sessions);
      sessions.delete(id);
      const activeSessionId =
        state.activeSessionId === id
          ? (sessions.keys().next().value ?? null)
          : state.activeSessionId;
      return { sessions, activeSessionId };
    });
  },

  updateSession(id, patch) {
    set(state => {
      const sessions = new Map(state.sessions);
      const existing = sessions.get(id);
      if (!existing) return {};
      sessions.set(id, { ...existing, ...patch, updatedAt: Date.now() });
      return { sessions };
    });
  },

  setSessionStatus(id, status) {
    get().updateSession(id, { status });
  },
});
