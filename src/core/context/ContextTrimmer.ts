/**
 * @module core/context/ContextTrimmer
 * @layer core
 *
 * 上下文裁剪策略，基于滑动窗口控制发送给模型的消息数量。
 *
 * 职责：
 *   - 按 token 预算或消息条数裁剪历史消息
 *   - 始终保留 system 消息和最新的 N 条消息
 *   - 支持可配置的裁剪策略（token-based / count-based）
 *
 * 约束：
 *   - 只依赖 core/types 和 core/message/IMessage
 *   - 不依赖任何 LLM SDK，token 计数通过注入的 countFn 实现
 *   - 可单元测试：纯函数，无副作用
 */

import type { IMessage } from '../message/IMessage';

export interface TrimOptions {
  /** 最大 token 预算（优先级高于 maxMessages） */
  maxTokens?: number;
  /** 最大消息条数（fallback 策略） */
  maxMessages?: number;
  /** 外部注入的 token 计数函数 */
  countTokens?: (messages: IMessage[]) => Promise<number>;
}

export class ContextTrimmer {
  private readonly options: Required<Omit<TrimOptions, 'countTokens'>> & {
    countTokens?: TrimOptions['countTokens'];
  };

  constructor(options: TrimOptions = {}) {
    this.options = {
      maxTokens: options.maxTokens ?? 0,
      maxMessages: options.maxMessages ?? 20,
      countTokens: options.countTokens,
    };
  }

  /**
   * 裁剪消息列表，返回适合发送给模型的子集。
   * system 消息始终保留在首位。
   */
  async trim(messages: IMessage[]): Promise<IMessage[]> {
    const system = messages.filter(m => m.role === 'system');
    const nonSystem = messages.filter(m => m.role !== 'system');

    if (this.options.maxTokens > 0 && this.options.countTokens) {
      return this.trimByTokens(system, nonSystem);
    }
    return this.trimByCount(system, nonSystem);
  }

  private trimByCount(system: IMessage[], nonSystem: IMessage[]): IMessage[] {
    const budget = Math.max(0, this.options.maxMessages - system.length);
    const sliced = nonSystem.slice(-budget);
    return [...system, ...sliced];
  }

  private async trimByTokens(
    system: IMessage[],
    nonSystem: IMessage[]
  ): Promise<IMessage[]> {
    const countTokens = this.options.countTokens!;
    const systemTokens = await countTokens(system);
    const budget = this.options.maxTokens - systemTokens;

    // 从最新消息向前累积，直到超出预算
    const selected: IMessage[] = [];
    for (let i = nonSystem.length - 1; i >= 0; i--) {
      const candidate = [nonSystem[i], ...selected];
      const tokens = await countTokens(candidate);
      if (tokens > budget) break;
      selected.unshift(nonSystem[i]);
    }

    return [...system, ...selected];
  }
}
