/**
 * @module core/session
 * @layer core
 *
 * 会话领域模型定义。
 *
 * 职责：
 *   - ISession：一次对话会话的完整状态，包含模型配置、激活节点、插件列表、Agent 绑定
 *   - ISessionRepository：会话持久化端口，由 infrastructure 层实现
 *
 * 约束：
 *   - 只依赖 core/types，不依赖 UI 层或 store 层
 *   - 每个 Session 独立持有 ModelConfig，支持多会话多模型并发
 *   - agentId 为 null 时表示普通对话模式，非 null 时进入 Agent 模式
 */

import type { SessionId, ModelConfig, NodeId, PluginId, AgentId } from '../types';

// ─── Session ──────────────────────────────────────────────────────────────────

export type SessionStatus = 'idle' | 'running' | 'error';

export interface ISession {
  id: SessionId;
  title: string;
  modelConfig: ModelConfig;
  activeNodeId: NodeId | null;
  status: SessionStatus;
  enabledPluginIds: PluginId[];
  agentId: AgentId | null;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

export interface ISessionRepository {
  getById(id: SessionId): ISession | undefined;
  getAll(): ISession[];
  create(config: Omit<ISession, 'id' | 'createdAt' | 'updatedAt'>): ISession;
  update(id: SessionId, patch: Partial<ISession>): void;
  delete(id: SessionId): void;
}
