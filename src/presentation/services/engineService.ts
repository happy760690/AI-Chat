/**
 * @module presentation/services/engineService
 * @layer presentation (service boundary)
 *
 * AIEngine 单例工厂，负责组装 core 层依赖。
 *
 * 职责：
 *   - 创建并持有 AIEngine 单例
 *   - 注册 MockModelAdapter（开发环境）
 *   - 提供 getEngine() 供 hooks 调用
 *   - 提供 getSupportedModels() 供模型切换 UI 使用
 *
 * 约束：
 *   - UI 组件不直接 import Adapter，只通过 getEngine() 间接使用
 *   - 生产环境替换 MockModelAdapter 为真实 Adapter，不需修改其他代码
 */

import { AIEngine } from '../../core/engine/AIEngine';
import { PluginManager } from '../../core/plugins/PluginManager';
import { MockModelAdapter } from '../../infrastructure/mock/MockModelAdapter';
import { useStore } from '../../store';
import type { ModelId } from '../../core/types';
import type { IMessage } from '../../core/message/IMessage';

// ─── 注册可用模型 ─────────────────────────────────────────────────────────────

const ADAPTERS = [
  new MockModelAdapter('mock-gpt-4'),
  new MockModelAdapter('mock-gpt-3.5'),
  new MockModelAdapter('mock-claude-3'),
];

const adapterMap = new Map(ADAPTERS.map(a => [a.modelId, a]));

// ─── 组装 PluginManager ───────────────────────────────────────────────────────

const pluginManager = new PluginManager();

// ─── 组装 AIEngine ────────────────────────────────────────────────────────────

const engine = new AIEngine({
  getAdapter: (modelId: ModelId) => adapterMap.get(modelId),
  getAgentRunner: () => undefined, // Agent 阶段接入
  pluginManager,
  messageRepository: {
    getById: () => undefined,
    getTree: () => undefined,
    getActivePath: (sessionId) => useStore.getState().getActivePath(sessionId),
    append: () => {},
    updateContent: () => {},
    updateStreamStatus: () => {},
    branch: () => {},
    setActivePath: () => {},
  } satisfies import('../../core/message/IMessage').IMessageRepository,
  trimOptions: { maxMessages: 20 },
});

// ─── 初始化：为所有 session 设置默认 model ────────────────────────────────────

export function getEngine(): AIEngine {
  return engine;
}

export function getSupportedModels(): ModelId[] {
  return ADAPTERS.map(a => a.modelId);
}

export function getPluginManager(): PluginManager {
  return pluginManager;
}

/**
 * 切换 session 绑定的模型。
 * 由 UI 层的模型选择器调用。
 */
export function switchModel(sessionId: string, modelId: ModelId): void {
  engine.switchModel(sessionId, modelId);
  useStore.getState().updateSession(sessionId, {
    modelConfig: { modelId },
  });
}
