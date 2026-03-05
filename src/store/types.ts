/**
 * @module store/types
 * @layer store
 *
 * RootStore 类型，由各 Slice 组合而成。
 */

export type { SessionSlice } from './sessionSlice';
export type { MessageSlice } from './messageSlice';
export type { StreamSlice } from './streamSlice';

import type { SessionSlice } from './sessionSlice';
import type { MessageSlice } from './messageSlice';
import type { StreamSlice } from './streamSlice';

export type RootStore = SessionSlice & MessageSlice & StreamSlice;
