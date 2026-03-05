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
