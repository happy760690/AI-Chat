/**
 * @module agent
 * @layer agent
 *
 * Agent 注册表与定义，管理所有可用 Agent 的元数据与运行器。
 *
 * 职责：
 *   - AgentDefinition：Agent 的静态配置（系统提示、最大步数、工具列表、RAG 列表）
 *   - IAgentRegistry：Agent 的注册、注销与查询，解耦 Engine 与具体 Agent 实现
 *
 * 约束：
 *   - 只依赖 core/types 和 core/ports/IAgentRunner
 *   - AgentDefinition 是纯数据，不包含任何执行逻辑
 *   - 每个 Agent 对应一个 IAgentRunner 实现，通过 registry 绑定
 *
 * 依赖方向：agent → core（单向）
 */

import type { AgentId } from '../core/types';
import type { IAgentRunner } from '../core/ports/IAgentRunner';

// ─── Agent Registry ───────────────────────────────────────────────────────────

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description: string;
  systemPrompt: string;
  maxSteps: number;
  enabledToolIds: string[];
  enabledRAGProviderIds: string[];
}

export interface IAgentRegistry {
  register(definition: AgentDefinition, runner: IAgentRunner): void;
  unregister(agentId: AgentId): void;
  getDefinition(agentId: AgentId): AgentDefinition | undefined;
  getRunner(agentId: AgentId): IAgentRunner | undefined;
  getAll(): AgentDefinition[];
}
