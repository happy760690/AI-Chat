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
