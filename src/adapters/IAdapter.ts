/**
 * @module adapters
 * @layer adapters
 *
 * 模型适配器注册表，管理所有 LLM 适配器实例。
 *
 * 职责：
 *   - IAdapterRegistry：适配器的注册、注销与查询
 *   - 供 AIEngine 在运行时根据 ModelId 动态选取对应适配器
 *   - getSupportedModelIds() 用于 UI 层渲染模型选择列表
 *
 * 约束：
 *   - 只依赖 core/types 和 core/ports/IModelAdapter
 *   - 具体适配器实现（OpenAIAdapter / ClaudeAdapter 等）在本层各自文件中
 *   - 注册表本身不持有任何模型调用逻辑
 *
 * 依赖方向：adapters → core（单向）
 */

import type { ModelId } from '../core/types';
import type { IModelAdapter } from '../core/ports/IModelAdapter';

// ─── Adapter Registry ─────────────────────────────────────────────────────────

export interface IAdapterRegistry {
  register(adapter: IModelAdapter): void;
  unregister(modelId: ModelId): void;
  get(modelId: ModelId): IModelAdapter | undefined;
  getAll(): IModelAdapter[];
  getSupportedModelIds(): ModelId[];
}
