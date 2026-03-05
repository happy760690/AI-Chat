/**
 * @module core/abort/AbortRegistry
 * @layer core
 *
 * AbortController 注册表，管理每个 Session 的中断控制器生命周期。
 *
 * 职责：
 *   - 为每个 Session 创建并持有 AbortController
 *   - 提供 abort(sessionId) 触发中断
 *   - 提供 getSignal(sessionId) 供下游（Adapter / Tool）订阅中断信号
 *   - cleanup 在 Session 结束后释放资源
 *
 * 约束：
 *   - 不依赖任何其他模块，纯内存操作
 *   - 每次 create() 会替换旧 controller（自动中断上一次未完成的请求）
 *   - 可单元测试：无副作用，无 I/O
 */

import type { SessionId } from '../types';

export class AbortRegistry {
  private readonly controllers = new Map<SessionId, AbortController>();

  /**
   * 为 session 创建新的 AbortController。
   * 若已存在旧 controller，先中断再替换。
   */
  create(sessionId: SessionId): AbortController {
    const existing = this.controllers.get(sessionId);
    if (existing && !existing.signal.aborted) {
      existing.abort('replaced');
    }
    const controller = new AbortController();
    this.controllers.set(sessionId, controller);
    return controller;
  }

  /**
   * 获取 session 当前的 AbortSignal。
   * 若不存在则返回一个已中断的 signal（防御性设计）。
   */
  getSignal(sessionId: SessionId): AbortSignal {
    return this.controllers.get(sessionId)?.signal ?? AbortSignal.abort('not_found');
  }

  /**
   * 中断指定 session 的当前请求。
   * 幂等：对已中断或不存在的 session 调用无副作用。
   */
  abort(sessionId: SessionId): void {
    const controller = this.controllers.get(sessionId);
    if (controller && !controller.signal.aborted) {
      controller.abort('user_abort');
    }
  }

  /**
   * 检查 session 是否正在运行（controller 存在且未中断）。
   */
  isRunning(sessionId: SessionId): boolean {
    const controller = this.controllers.get(sessionId);
    return controller !== undefined && !controller.signal.aborted;
  }

  /**
   * 释放 session 的 controller，通常在 session 销毁时调用。
   */
  cleanup(sessionId: SessionId): void {
    this.controllers.delete(sessionId);
  }

  /**
   * 中断并清理所有 session（用于全局销毁场景）。
   */
  abortAll(): void {
    for (const [id] of this.controllers) {
      this.abort(id);
      this.cleanup(id);
    }
  }
}
