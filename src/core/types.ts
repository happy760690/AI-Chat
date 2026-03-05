// ─── Shared Domain Primitives ────────────────────────────────────────────────

export type ModelId = string;
export type SessionId = string;
export type MessageId = string;
export type NodeId = string;
export type ToolId = string;
export type PluginId = string;
export type AgentId = string;

export type Role = 'user' | 'assistant' | 'system' | 'tool';

export type StreamStatus = 'idle' | 'streaming' | 'done' | 'error' | 'aborted';

// ─── Content Types ────────────────────────────────────────────────────────────

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  url: string;
  mimeType: string;
}

export interface ToolCallContent {
  type: 'tool_call';
  toolId: ToolId;
  callId: string;
  input: Record<string, unknown>;
}

export interface ToolResultContent {
  type: 'tool_result';
  callId: string;
  output: unknown;
  isError: boolean;
}

export type MessageContent =
  | TextContent
  | ImageContent
  | ToolCallContent
  | ToolResultContent;

// ─── Model Config ─────────────────────────────────────────────────────────────

export interface ModelConfig {
  modelId: ModelId;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  [key: string]: unknown;
}

// ─── Stream ───────────────────────────────────────────────────────────────────

export interface StreamChunk {
  delta: string;
  index: number;
  finishReason?: string;
}

export interface UsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
