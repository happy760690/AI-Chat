/**
 * @module core/engine/AIEngine
 * @layer core
 *
 * AI 引擎核心编排器，协调模型调用、插件钩子、上下文裁剪与流式输出。
 *
 * 职责：
 *   - sendMessage：普通对话流程（插件钩子 → 上下文裁剪 → 模型调用 → 流式输出）
 *   - runAgent：委托给 IAgentRunner，本层只负责生命周期管理
 *   - abort / switchModel：Session 级别的控制操作
 *
 * 约束：
 *   - 只依赖 core 层内部模块，不依赖 UI / store / infrastructure
 *   - 所有模型调用通过 IModelAdapter，通过 IAdapterRegistry 查找
 *   - 副作用（SSE）完全封装在 IModelAdapter 实现中，Engine 不感知
 *   - 可单元测试：所有依赖均通过构造函数注入
 */

import type { SessionId, ModelId, StreamChunk } from '../types';
import type { IAIEngine, SendMessageOptions } from './IAIEngine';
import type { IAgentRunner, AgentRunOptions, AgentStep } from '../ports/IAgentRunner';
import type { IModelAdapter } from '../ports/IModelAdapter';
import type { IPluginManager, PluginContext } from '../ports/IPluginManager';
import type { IMessageRepository, IMessage } from '../message/IMessage';
import type { SessionStatus } from '../session/ISession';
import { AbortRegistry } from '../abort/AbortRegistry';
import { ContextTrimmer } from '../context/ContextTrimmer';
import { StreamController } from '../stream/StreamController';

export interface AIEngineOptions {
  getAdapter: (modelId: ModelId) => IModelAdapter | undefined;
  getAgentRunner: (agentId: string) => IAgentRunner | undefined;
  pluginManager: IPluginManager;
  messageRepository: IMessageRepository;
  trimOptions?: ConstructorParameters<typeof ContextTrimmer>[0];
  scheduler?: ConstructorParameters<typeof StreamController>[1];
}

export class AIEngine implements IAIEngine {
  private readonly abortRegistry = new AbortRegistry();
  private readonly trimmer: ContextTrimmer;
  private readonly sessionStatus = new Map<SessionId, SessionStatus>();

  constructor(private readonly opts: AIEngineOptions) {
    this.trimmer = new ContextTrimmer(opts.trimOptions);
  }

  async *sendMessage(options: SendMessageOptions): AsyncIterable<StreamChunk> {
    const { sessionId, message, signal } = options;
    this.setStatus(sessionId, 'running');

    try {
      // 1. beforeBuildContext 钩子
      let ctx: PluginContext = { sessionId, messages: [message] };
      ctx = await this.opts.pluginManager.runHook('beforeBuildContext', ctx);

      // 2. 获取历史消息并裁剪上下文
      const history = this.opts.messageRepository.getActivePath(sessionId);
      const trimmed = await this.trimmer.trim([...history, message]);

      // 3. beforeSend 钩子
      ctx = await this.opts.pluginManager.runHook('beforeSend', {
        ...ctx,
        messages: trimmed,
      });
      const finalMessages = (ctx.messages ?? trimmed) as IMessage[];

      // 4. 获取适配器
      const adapter = this.resolveAdapter(sessionId);

      // 5. 流式调用模型，通过 StreamController 合并 rAF 更新
      const source = adapter.chat(finalMessages, { modelId: adapter.modelId }, signal);
      yield* this.streamWithCallbacks(sessionId, source, signal);

      // 6. afterReceive 钩子
      await this.opts.pluginManager.runHook('afterReceive', { sessionId });

      this.setStatus(sessionId, 'idle');
    } catch (err) {
      await this.opts.pluginManager.runHook('onError', { sessionId, error: err });
      this.setStatus(sessionId, 'error');
      throw err;
    }
  }

  async *runAgent(options: AgentRunOptions): AsyncIterable<AgentStep> {
    const { sessionId, agentId, signal } = options;
    this.setStatus(sessionId, 'running');

    try {
      const runner = this.opts.getAgentRunner(agentId);
      if (!runner) throw new Error(`Agent not found: ${agentId}`);
      yield* runner.run({ ...options, signal });
      this.setStatus(sessionId, 'idle');
    } catch (err) {
      await this.opts.pluginManager.runHook('onError', { sessionId, error: err });
      this.setStatus(sessionId, 'error');
      throw err;
    } finally {
      this.abortRegistry.cleanup(sessionId);
    }
  }

  abort(sessionId: SessionId): void {
    this.abortRegistry.abort(sessionId);
    this.setStatus(sessionId, 'idle');
  }

  switchModel(sessionId: SessionId, modelId: ModelId): void {
    this.currentModelIds.set(sessionId, modelId);
  }

  getSessionStatus(sessionId: SessionId): SessionStatus {
    return this.sessionStatus.get(sessionId) ?? 'idle';
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private readonly currentModelIds = new Map<SessionId, ModelId>();

  private resolveAdapter(sessionId: SessionId): IModelAdapter {
    const modelId = this.currentModelIds.get(sessionId);
    if (!modelId) throw new Error(`No model assigned to session: ${sessionId}`);
    const adapter = this.opts.getAdapter(modelId);
    if (!adapter) throw new Error(`Adapter not found: ${modelId}`);
    return adapter;
  }

  private setStatus(sessionId: SessionId, status: SessionStatus): void {
    this.sessionStatus.set(sessionId, status);
  }

  private async *streamWithCallbacks(
    sessionId: SessionId,
    source: AsyncIterable<StreamChunk>,
    signal: AbortSignal
  ): AsyncIterable<StreamChunk> {
    const chunks: StreamChunk[] = [];
    let error: unknown;
    let aborted = false;

    const streamCtrl = new StreamController(
      {
        onDelta: (delta, _acc) => {
          chunks.push({ delta, index: chunks.length });
        },
        onDone: () => {},
        onError: (err) => { error = err; },
        onAbort: () => { aborted = true; },
      },
      this.opts.scheduler
    );

    await streamCtrl.consume(source, signal);

    if (error) throw error;
    if (aborted) return;

    yield* chunks;
  }
}
