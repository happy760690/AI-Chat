/**
 * @module core/ports/IModelAdapter
 * @layer core (port)
 *
 * 模型适配器端口（Hexagonal Architecture - Driven Port）。
 *
 * 职责：
 *   - 抽象所有 LLM 调用，屏蔽 OpenAI / Claude / 本地模型等差异
 *   - 声明模型能力特性（ModelFeatures），供 Engine 在运行时做能力判断
 *   - 流式输出通过 AsyncIterable<StreamChunk> 统一表达
 *
 * 约束：
 *   - 只依赖 core/types，不依赖任何具体 SDK
 *   - 具体实现位于 adapters/ 层，core 层只持有此接口
 *   - countTokens 用于 RAG 上下文裁剪，必须实现
 */

import type { ModelConfig, StreamChunk } from '../types';
import type { IMessage } from '../message/IMessage';

// ─── Model Adapter Port ───────────────────────────────────────────────────────

export interface IModelAdapter {
  readonly modelId: string;
  readonly supportedFeatures: ModelFeatures;

  chat(
    messages: IMessage[],
    config: ModelConfig,
    signal: AbortSignal
  ): AsyncIterable<StreamChunk>;

  countTokens(messages: IMessage[], config: ModelConfig): Promise<number>;
}

export interface ModelFeatures {
  streaming: boolean;
  toolCalling: boolean;
  vision: boolean;
  systemPrompt: boolean;
}
