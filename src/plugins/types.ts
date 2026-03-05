/**
 * @module plugins
 * @layer plugins
 *
 * 插件工厂与 Manifest 定义，管理插件的元数据与创建逻辑。
 *
 * 职责：
 *   - PluginManifest：插件的静态描述（版本、关注的钩子、配置 schema）
 *   - IPluginFactory：根据配置创建插件实例，支持动态加载
 *
 * 约束：
 *   - 只依赖 core/types 和 core/ports/IPluginManager
 *   - configSchema 用于 UI 层渲染插件配置表单（可选）
 *   - 插件实现文件在本层各自文件中，不得跨插件相互依赖
 *
 * 依赖方向：plugins → core（单向）
 */

import type { PluginId } from '../core/types';
import type { IPlugin, PluginLifecycleHook } from '../core/ports/IPluginManager';

// ─── Plugin Manifest ──────────────────────────────────────────────────────────

export interface PluginManifest {
  id: PluginId;
  name: string;
  version: string;
  description: string;
  hooks: PluginLifecycleHook[];
  configSchema?: Record<string, unknown>;
}

export interface IPluginFactory {
  readonly manifest: PluginManifest;
  create(config: Record<string, unknown>): IPlugin;
}
