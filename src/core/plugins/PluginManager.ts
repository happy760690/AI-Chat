/**
 * @module core/plugins/PluginManager
 * @layer core
 *
 * 插件管理器实现，负责插件注册与生命周期钩子的串行执行。
 *
 * 职责：
 *   - 维护插件注册表（pluginId → IPlugin）
 *   - 维护 Session 级别的启用插件列表
 *   - runHook：按注册顺序串行执行所有关注该钩子的插件，上下文链式传递
 *
 * 约束：
 *   - 只依赖 core/ports/IPluginManager 和 core/types
 *   - 插件执行异常不得中断整个钩子链，记录错误后继续执行下一个插件
 *   - 可单元测试：无 I/O，依赖注入友好
 */

import type { PluginId, SessionId } from '../types';
import type {
  IPlugin,
  IPluginManager,
  PluginContext,
  PluginLifecycleHook,
} from '../ports/IPluginManager';

export class PluginManager implements IPluginManager {
  private readonly plugins = new Map<PluginId, IPlugin>();
  private readonly sessionPlugins = new Map<SessionId, Set<PluginId>>();

  register(plugin: IPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  unregister(id: PluginId): void {
    this.plugins.delete(id);
    for (const set of this.sessionPlugins.values()) {
      set.delete(id);
    }
  }

  get(id: PluginId): IPlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * 启用某个插件到指定 session。
   */
  enableForSession(sessionId: SessionId, pluginId: PluginId): void {
    if (!this.sessionPlugins.has(sessionId)) {
      this.sessionPlugins.set(sessionId, new Set());
    }
    this.sessionPlugins.get(sessionId)!.add(pluginId);
  }

  /**
   * 从 session 中禁用某个插件。
   */
  disableForSession(sessionId: SessionId, pluginId: PluginId): void {
    this.sessionPlugins.get(sessionId)?.delete(pluginId);
  }

  /**
   * 获取 session 当前启用的插件列表（按注册顺序）。
   */
  getEnabled(sessionId: SessionId): IPlugin[] {
    const ids = this.sessionPlugins.get(sessionId);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.plugins.get(id))
      .filter((p): p is IPlugin => p !== undefined);
  }

  /**
   * 串行执行所有关注该钩子的插件。
   * 单个插件抛出异常时，错误写入 ctx.error 并继续执行后续插件。
   */
  async runHook(
    hook: PluginLifecycleHook,
    ctx: PluginContext
  ): Promise<PluginContext> {
    const plugins = this.getEnabled(ctx.sessionId).filter(p =>
      p.hooks.includes(hook)
    );

    let current = ctx;
    for (const plugin of plugins) {
      try {
        current = await plugin.onHook(hook, current);
      } catch (err) {
        current = { ...current, error: err };
      }
    }
    return current;
  }

  /**
   * 清理 session 的插件启用状态（session 销毁时调用）。
   */
  cleanupSession(sessionId: SessionId): void {
    this.sessionPlugins.delete(sessionId);
  }
}
