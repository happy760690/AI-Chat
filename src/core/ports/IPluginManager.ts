/**
 * @module core/ports/IPluginManager
 * @layer core (port)
 *
 * 插件管理器端口，定义插件生命周期钩子协议。
 *
 * 职责：
 *   - IPlugin：单个插件的抽象，声明关注的钩子并处理上下文
 *   - IPluginManager：插件注册、启用状态查询、钩子链式执行
 *   - PluginContext：钩子间传递的上下文对象，支持插件间数据流转
 *
 * 约束：
 *   - 只依赖 core/types
 *   - runHook 必须按注册顺序串行执行，前一个插件的输出作为下一个的输入
 *   - 插件不得直接调用 LLM，只能通过 PluginContext 传递数据影响主流程
 */

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
