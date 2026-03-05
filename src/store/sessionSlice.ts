/**
 * @module store/sessionSlice
 * @layer store
 *
 * 会话状态 Slice，管理会话列表与当前激活会话。
 *
 * 约束：
 *   - sessions 用数组存储，避免 Zustand selector 中 Map 引用不稳定问题
 *   - 不调用任何 core/engine，只管理纯状态
 */

import type { StateCreator } from 'zustand';
import type { SessionId, ModelId } from '../core/types';
import type { ISession, SessionStatus } from '../core/session/ISession';
import type { RootStore } from './types';

export interface SessionSlice {
  sessions: ISession[];
  activeSessionId: SessionId | null;
  setActiveSession(id: SessionId): void;
  createSession(modelId: ModelId): ISession;
  deleteSession(id: SessionId): void;
  updateSession(id: SessionId, patch: Partial<ISession>): void;
  setSessionStatus(id: SessionId, status: SessionStatus): void;
}

let sessionCounter = 0;

export const createSessionSlice: StateCreator<RootStore, [], [], SessionSlice> = (set, get) => ({
  sessions: [],
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
    set(state => ({
      sessions: [...state.sessions, session],
      activeSessionId: id,
    }));
    return session;
  },

  deleteSession(id) {
    set(state => {
      const sessions = state.sessions.filter(s => s.id !== id);
      const activeSessionId =
        state.activeSessionId === id
          ? (sessions[0]?.id ?? null)
          : state.activeSessionId;
      return { sessions, activeSessionId };
    });
  },

  updateSession(id, patch) {
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s
      ),
    }));
  },

  setSessionStatus(id, status) {
    get().updateSession(id, { status });
  },
});
