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

// RootStore 类型由各 slice 文件的实际接口组合而成，避免重复定义
export type { SessionSlice } from './sessionSlice';
export type { MessageSlice } from './messageSlice';
export type { StreamSlice } from './streamSlice';

import type { SessionSlice } from './sessionSlice';
import type { MessageSlice } from './messageSlice';
import type { StreamSlice } from './streamSlice';

export type RootStore = SessionSlice & MessageSlice & StreamSlice;
