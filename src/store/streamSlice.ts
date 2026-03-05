/**
 * @module store/streamSlice
 * @layer store
 *
 * 流式生成状态 Slice，管理每个 Session 的 AbortController。
 *
 * 职责：
 *   - 创建、中断、清理 AbortController
 *   - isStreaming 供 UI 判断是否显示中断按钮
 *
 * 约束：
 *   - 不调用 core/engine，只管理 AbortController 生命周期
 */

import type { StateCreator } from 'zustand';
import type { SessionId } from '../core/types';
import type { RootStore } from './types';

export interface StreamSlice {
  controllers: Map<SessionId, AbortController>;
  isStreaming(sessionId: SessionId): boolean;
  createController(sessionId: SessionId): AbortController;
  abort(sessionId: SessionId): void;
  cleanup(sessionId: SessionId): void;
}

export const createStreamSlice: StateCreator<RootStore, [], [], StreamSlice> = (set, get) => ({
  controllers: new Map(),

  isStreaming(sessionId) {
    const ctrl = get().controllers.get(sessionId);
    return ctrl !== undefined && !ctrl.signal.aborted;
  },

  createController(sessionId) {
    const existing = get().controllers.get(sessionId);
    if (existing && !existing.signal.aborted) existing.abort();
    const controller = new AbortController();
    set(state => {
      const controllers = new Map(state.controllers);
      controllers.set(sessionId, controller);
      return { controllers };
    });
    return controller;
  },

  abort(sessionId) {
    const ctrl = get().controllers.get(sessionId);
    if (ctrl && !ctrl.signal.aborted) ctrl.abort();
    set(state => {
      const controllers = new Map(state.controllers);
      controllers.delete(sessionId);
      return { controllers };
    });
  },

  cleanup(sessionId) {
    set(state => {
      const controllers = new Map(state.controllers);
      controllers.delete(sessionId);
      return { controllers };
    });
  },
});
