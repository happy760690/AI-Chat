import type { SessionId } from '../types';

// ─── RAG Provider Port ────────────────────────────────────────────────────────

export interface RAGDocument {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface RAGQuery {
  text: string;
  sessionId: SessionId;
  topK?: number;
  filters?: Record<string, unknown>;
}

export interface IRAGProvider {
  readonly providerId: string;

  retrieve(query: RAGQuery): Promise<RAGDocument[]>;
  ingest(docs: Omit<RAGDocument, 'score'>[]): Promise<void>;
  delete(ids: string[]): Promise<void>;
}
