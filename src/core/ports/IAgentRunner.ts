import type { SessionId, AgentId, IMessage } from '../types';

// ─── Agent Runner Port ────────────────────────────────────────────────────────

export type AgentStatus = 'idle' | 'thinking' | 'calling_tool' | 'done' | 'error' | 'aborted';

export interface AgentStep {
  index: number;
  type: 'llm' | 'tool_call' | 'tool_result' | 'rag';
  message: IMessage;
  timestamp: number;
}

export interface AgentRunOptions {
  sessionId: SessionId;
  agentId: AgentId;
  input: IMessage;
  signal: AbortSignal;
  maxSteps?: number;
}

export interface AgentRunResult {
  steps: AgentStep[];
  finalMessage: IMessage;
  status: AgentStatus;
}

export interface IAgentRunner {
  readonly agentId: AgentId;
  run(options: AgentRunOptions): AsyncIterable<AgentStep>;
}
