/**
 * @module core/ports/IRAGProvider
 * @layer core (port)
 *
 * RAG 检索增强生成提供者端口。
 *
 * 职责：
 *   - retrieve：根据查询文本检索相关文档片段，注入上下文
 *   - ingest：将文档写入向量存储（支持离线预处理）
 *   - delete：按 ID 删除文档，支持知识库更新
 *
 * 约束：
 *   - 只依赖 core/types，不依赖向量数据库 SDK
 *   - 具体实现（Pinecone / Chroma / 本地）位于 rag/ 层
 *   - RAGQuery 携带 sessionId，允许实现层做会话级别的过滤
 */

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
