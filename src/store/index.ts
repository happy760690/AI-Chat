/**
 * @module store/index
 * @layer store
 *
 * Zustand RootStore，组合三个 Slice。
 *
 * 职责：
 *   - 合并 SessionSlice / MessageSlice / StreamSlice
 *   - 导出 useStore hook 供 presentation 层使用
 *
 * 约束：
 *   - 不包含任何业务逻辑
 *   - UI 层只通过 useStore 访问状态，不直接操作 slice
 */

import { create } from 'zustand';
import { createSessionSlice } from './sessionSlice';
import { createMessageSlice } from './messageSlice';
import { createStreamSlice } from './streamSlice';
import type { SessionSlice } from './sessionSlice';
import type { MessageSlice } from './messageSlice';
import type { StreamSlice } from './streamSlice';

export type { SessionSlice, MessageSlice, StreamSlice };

export const useStore = create<SessionSlice & MessageSlice & StreamSlice>()((...a) => ({
  ...createSessionSlice(...a),
  ...createMessageSlice(...a),
  ...createStreamSlice(...a),
}));
