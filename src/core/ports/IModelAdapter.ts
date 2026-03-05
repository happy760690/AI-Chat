import type { ModelConfig, StreamChunk, UsageStats, IMessage } from '../types';

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
