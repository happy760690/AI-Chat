/**
 * @module store/streamSlice
 * @layer store
 *
 * 流式生成状态 Slice，管理每个 Session 的 AbortController。
 * 用 Record 替代 Map，避免 Zustand selector 无限循环。
 */

import type { StateCreator } from 'zustand';
import type { SessionId } from '../core/types';
import type { RootStore } from './types';

export interface StreamSlice {
  controllers: Record<SessionId, AbortController>;
  isStreaming(sessionId: SessionId): boolean;
  createController(sessionId: SessionId): AbortController;
  abort(sessionId: SessionId): void;
  cleanup(sessionId: SessionId): void;
}

export const createStreamSlice: StateCreator<RootStore, [], [], StreamSlice> = (set, get) => ({
  controllers: {},

  isStreaming(sessionId) {
    const ctrl = get().controllers[sessionId];
    return ctrl !== undefined && !ctrl.signal.aborted;
  },

  createController(sessionId) {
    const existing = get().controllers[sessionId];
    if (existing && !existing.signal.aborted) existing.abort();
    const controller = new AbortController();
    set(state => ({
      controllers: { ...state.controllers, [sessionId]: controller },
    }));
    return controller;
  },

  abort(sessionId) {
    const ctrl = get().controllers[sessionId];
    if (ctrl && !ctrl.signal.aborted) ctrl.abort();
    set(state => {
      const { [sessionId]: _, ...rest } = state.controllers;
      return { controllers: rest };
    });
  },

  cleanup(sessionId) {
    set(state => {
      const { [sessionId]: _, ...rest } = state.controllers;
      return { controllers: rest };
    });
  },
});
