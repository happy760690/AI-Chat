import type { StreamChunk } from '../../core/types';

// ─── SSE Client ───────────────────────────────────────────────────────────────

export interface SSERequestOptions {
  url: string;
  method: 'POST' | 'GET';
  headers?: Record<string, string>;
  body?: unknown;
  signal: AbortSignal;
}

export interface ISSEClient {
  stream(options: SSERequestOptions): AsyncIterable<StreamChunk>;
}
