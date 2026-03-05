/**
 * @module core/types
 * @layer core
 *
 * 所有模块共享的领域原语（Domain Primitives）。
 *
 * 职责：
 *   - 定义全局 ID 类型别名，防止原始类型混用
 *   - 定义消息内容的 discriminated union
 *   - 定义 ModelConfig、StreamChunk、UsageStats 等跨层共享结构
 *
 * 约束：
 *   - 不得 import 任何其他模块
 *   - 不得包含任何运行时逻辑（纯类型声明）
 *   - 所有其他层均可依赖本文件，本文件不依赖任何层
 */

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
