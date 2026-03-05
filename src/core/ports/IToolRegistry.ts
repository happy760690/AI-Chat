import type { ToolId } from '../types';

// ─── Tool Registry Port ───────────────────────────────────────────────────────

export type ToolParameterType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface ToolParameter {
  type: ToolParameterType;
  description: string;
  required: boolean;
  enum?: unknown[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
}

export interface ToolSchema {
  id: ToolId;
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
}

export interface ToolCallRequest {
  callId: string;
  toolId: ToolId;
  input: Record<string, unknown>;
  signal: AbortSignal;
}

export interface ToolCallResult {
  callId: string;
  output: unknown;
  isError: boolean;
}

export interface ITool {
  readonly schema: ToolSchema;
  execute(request: ToolCallRequest): Promise<ToolCallResult>;
}

export interface IToolRegistry {
  register(tool: ITool): void;
  unregister(toolId: ToolId): void;
  get(toolId: ToolId): ITool | undefined;
  getAll(): ITool[];
  getSchemas(): ToolSchema[];
}
