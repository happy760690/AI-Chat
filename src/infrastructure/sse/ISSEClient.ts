/**
 * @module infrastructure/sse
 * @layer infrastructure
 *
 * SSE（Server-Sent Events）通信客户端端口。
 *
 * 职责：
 *   - 封装 SSE 连接的建立、数据解析、错误处理
 *   - 通过 AsyncIterable<StreamChunk> 向上层提供统一的流式数据接口
 *   - 支持 AbortSignal 中断连接
 *
 * 约束：
 *   - 只依赖 core/types，不依赖任何 UI 或 store 层
 *   - 具体实现（fetch / EventSource）位于 infrastructure/sse/ 目录下
 *   - 预留 WebSocket 扩展：未来可新增 IWSClient 实现相同的 stream 签名
 */

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
