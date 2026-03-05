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
import type { IMessage } from '../message/IMessage';

// ─── Lifecycle Hooks ──────────────────────────────────────────────────────────

export type PluginLifecycleHook =
  | 'beforeBuildContext'   // 上下文裁剪前，可注入额外消息
  | 'beforeSend'           // 发送给模型前，可修改消息列表
  | 'afterReceive'         // 收到模型响应后，可后处理内容
  | 'onError'              // 发生错误时，可上报或降级
  | 'onToolCall'           // Tool 被调用前
  | 'onToolResult'         // Tool 返回结果后
  | 'onSessionCreate'
  | 'onSessionDestroy';

// ─── Plugin Context ───────────────────────────────────────────────────────────

export interface PluginContext {
  sessionId: SessionId;
  messages?: IMessage[];
  error?: unknown;
  [key: string]: unknown;
}

// ─── Plugin Interface ─────────────────────────────────────────────────────────

export interface IPlugin {
  readonly id: PluginId;
  readonly name: string;
  readonly hooks: PluginLifecycleHook[];
  onHook(hook: PluginLifecycleHook, ctx: PluginContext): Promise<PluginContext>;
}

// ─── Plugin Manager Interface ─────────────────────────────────────────────────

export interface IPluginManager {
  register(plugin: IPlugin): void;
  unregister(id: PluginId): void;
  get(id: PluginId): IPlugin | undefined;
  getEnabled(sessionId: SessionId): IPlugin[];
  runHook(hook: PluginLifecycleHook, ctx: PluginContext): Promise<PluginContext>;
}
