import type { PluginId, SessionId } from '../types';

// ─── Plugin Manager Port ──────────────────────────────────────────────────────

export type PluginLifecycleHook =
  | 'beforeSend'
  | 'afterReceive'
  | 'onToolCall'
  | 'onToolResult'
  | 'onSessionCreate'
  | 'onSessionDestroy';

export interface PluginContext {
  sessionId: SessionId;
  [key: string]: unknown;
}

export interface IPlugin {
  readonly id: PluginId;
  readonly name: string;
  readonly hooks: PluginLifecycleHook[];
  onHook(hook: PluginLifecycleHook, ctx: PluginContext): Promise<PluginContext>;
}

export interface IPluginManager {
  register(plugin: IPlugin): void;
  unregister(id: PluginId): void;
  get(id: PluginId): IPlugin | undefined;
  getEnabled(sessionId: SessionId): IPlugin[];
  runHook(hook: PluginLifecycleHook, ctx: PluginContext): Promise<PluginContext>;
}
