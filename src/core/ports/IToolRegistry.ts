/**
 * @module core/ports/IToolRegistry
 * @layer core (port)
 *
 * Tool 注册表端口与工具调用协议定义。
 *
 * 职责：
 *   - ITool：单个工具的抽象，包含 schema 声明与 execute 执行
 *   - IToolRegistry：工具的注册、注销、查询，供 Agent 在运行时动态发现工具
 *   - ToolSchema：工具参数的 JSON Schema 描述，直接传递给 LLM 的 function calling
 *
 * 约束：
 *   - 只依赖 core/types
 *   - execute 必须通过 AbortSignal 支持中断
 *   - isError 为 true 时 output 为错误信息，Agent 应据此决策是否重试
 */

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
