/**
 * @module core/stream/StreamController
 * @layer core
 *
 * 流式输出控制器，负责消费 AsyncIterable<StreamChunk> 并通过 rAF 合并批量更新。
 *
 * 职责：
 *   - 消费上游 AsyncIterable<StreamChunk>，缓冲 delta 字符串
 *   - 使用 requestAnimationFrame（浏览器）或 setTimeout（Node/test）合并高频更新
 *   - 通过回调通知外部（store / UI）当前累积文本与完成状态
 *   - 响应 AbortSignal，中断后触发 onAbort 回调
 *
 * 约束：
 *   - 不依赖任何 UI 框架或 store
 *   - rAF 调度器可通过构造参数替换，便于单元测试（注入 setTimeout）
 *   - 所有回调均为同步调用，不抛出异常（异常由 onError 回调处理）
 */

import type { StreamChunk } from '../types';

export interface StreamCallbacks {
  onDelta: (delta: string, accumulated: string) => void;
  onDone: (accumulated: string) => void;
  onError: (error: unknown) => void;
  onAbort: () => void;
}

export type SchedulerFn = (cb: () => void) => void;

const defaultScheduler: SchedulerFn =
  typeof requestAnimationFrame !== 'undefined'
    ? (cb) => requestAnimationFrame(cb)
    : (cb) => setTimeout(cb, 0);

export class StreamController {
  private accumulated = '';
  private pendingDelta = '';
  private scheduled = false;
  private done = false;

  constructor(
    private readonly callbacks: StreamCallbacks,
    private readonly scheduler: SchedulerFn = defaultScheduler
  ) {}

  /**
   * 启动流式消费。返回 Promise，在流结束或中断后 resolve。
   */
  async consume(
    source: AsyncIterable<StreamChunk>,
    signal: AbortSignal
  ): Promise<void> {
    if (signal.aborted) {
      this.callbacks.onAbort();
      return;
    }

    const onAbort = () => {
      this.done = true;
      this.flush();
      this.callbacks.onAbort();
    };
    signal.addEventListener('abort', onAbort, { once: true });

    try {
      for await (const chunk of source) {
        if (signal.aborted) break;
        this.pendingDelta += chunk.delta;
        this.scheduleFlush();
      }

      if (!signal.aborted) {
        this.done = true;
        this.flush();
        this.callbacks.onDone(this.accumulated);
      }
    } catch (err) {
      if (!signal.aborted) {
        this.callbacks.onError(err);
      }
    } finally {
      signal.removeEventListener('abort', onAbort);
    }
  }

  private scheduleFlush(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    this.scheduler(() => {
      this.scheduled = false;
      this.flush();
    });
  }

  private flush(): void {
    if (!this.pendingDelta) return;
    const delta = this.pendingDelta;
    this.pendingDelta = '';
    this.accumulated += delta;
    this.callbacks.onDelta(delta, this.accumulated);
  }

  reset(): void {
    this.accumulated = '';
    this.pendingDelta = '';
    this.scheduled = false;
    this.done = false;
  }
}
