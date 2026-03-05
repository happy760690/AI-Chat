/**
 * @module rag
 * @layer rag
 *
 * RAG Pipeline 完整定义，包含向量存储、Embedding 服务与检索管道。
 *
 * 职责：
 *   - IEmbeddingService：文本向量化，解耦具体 Embedding 模型
 *   - IVectorStore：向量的增删查，解耦具体向量数据库
 *   - IRAGPipeline：组合 Embedding + VectorStore + Provider，提供完整检索流程
 *   - buildContextPrompt：将检索结果格式化为 LLM 可消费的上下文字符串
 *
 * 约束：
 *   - 只依赖 core/ports/IRAGProvider，不依赖 UI / store / adapters
 *   - IVectorStore 与 IEmbeddingService 均为端口，具体实现可替换
 *   - RAGPipelineConfig 中的 chunkSize / chunkOverlap 用于文档预处理阶段
 *
 * 依赖方向：rag → core（单向）
 */

import type { IRAGProvider, RAGDocument, RAGQuery } from '../core/ports/IRAGProvider';

// ─── RAG Pipeline ─────────────────────────────────────────────────────────────

export type EmbeddingModel = string;

export interface RAGPipelineConfig {
  providerId: string;
  embeddingModel: EmbeddingModel;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
}

export interface IEmbeddingService {
  embed(texts: string[]): Promise<number[][]>;
}

export interface IVectorStore {
  upsert(id: string, vector: number[], metadata?: Record<string, unknown>): Promise<void>;
  query(vector: number[], topK: number, filters?: Record<string, unknown>): Promise<RAGDocument[]>;
  delete(ids: string[]): Promise<void>;
}

export interface IRAGPipeline {
  readonly config: RAGPipelineConfig;
  readonly provider: IRAGProvider;
  retrieve(query: RAGQuery): Promise<RAGDocument[]>;
  buildContextPrompt(docs: RAGDocument[]): string;
}
