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
