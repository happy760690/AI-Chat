/**
 * @module rag/RAGPlugin
 * @layer rag
 *
 * RAG 检索插件，以插件形式挂载到 PluginManager，在 beforeBuildContext 钩子中
 * 执行向量检索并将召回内容注入消息上下文。
 *
 * 职责：
 *   - 监听 beforeBuildContext 钩子，提取用户最新消息作为查询
 *   - 调用 IRAGProvider.retrieve() 获取相关文档
 *   - 将召回内容格式化为 system 消息，prepend 到消息列表
 *   - 支持运行时开启 / 关闭（enabled 标志）
 *
 * 约束：
 *   - 只依赖 core/ports/IRAGProvider 和 core/ports/IPluginManager
 *   - 不依赖任何向量数据库 SDK，具体检索由注入的 IRAGProvider 实现
 *   - 可单元测试：IRAGProvider 可 mock
 *
 * 依赖方向：rag → core（单向）
 */

import type { IPlugin, PluginContext, PluginLifecycleHook } from '../core/ports/IPluginManager';
import type { IRAGProvider } from '../core/ports/IRAGProvider';
import type { IMessage } from '../core/message/IMessage';
import type { PluginId } from '../core/types';

export interface RAGPluginOptions {
  pluginId?: PluginId;
  topK?: number;
  contextHeader?: string;
}

export class RAGPlugin implements IPlugin {
  readonly id: PluginId;
  readonly name = 'RAGPlugin';
  readonly hooks: PluginLifecycleHook[] = ['beforeBuildContext'];

  private enabled = true;
  private readonly topK: number;
  private readonly contextHeader: string;

  constructor(
    private readonly provider: IRAGProvider,
    options: RAGPluginOptions = {}
  ) {
    this.id = options.pluginId ?? `rag-plugin-${provider.providerId}`;
    this.topK = options.topK ?? 5;
    this.contextHeader = options.contextHeader ?? '以下是相关参考资料：\n\n';
  }

  enable(): void  { this.enabled = true; }
  disable(): void { this.enabled = false; }
  isEnabled(): boolean { return this.enabled; }

  async onHook(hook: PluginLifecycleHook, ctx: PluginContext): Promise<PluginContext> {
    if (hook !== 'beforeBuildContext' || !this.enabled) return ctx;

    const messages = ctx.messages ?? [];
    const queryText = this.extractQueryText(messages);
    if (!queryText) return ctx;

    const docs = await this.provider.retrieve({
      text: queryText,
      sessionId: ctx.sessionId,
      topK: this.topK,
    });

    if (docs.length === 0) return ctx;

    const ragContent = this.contextHeader + docs
      .map((d, i) => `[${i + 1}] ${d.content}`)
      .join('\n\n');

    const ragMessage: IMessage = {
      id: `rag-${Date.now()}`,
      nodeId: `rag-node-${Date.now()}`,
      parentNodeId: null,
      sessionId: ctx.sessionId,
      role: 'system',
      content: [{ type: 'text', text: ragContent }],
      createdAt: Date.now(),
      streamStatus: 'done',
    };

    return { ...ctx, messages: [ragMessage, ...messages] };
  }

  private extractQueryText(messages: IMessage[]): string {
    const last = [...messages].reverse().find(m => m.role === 'user');
    if (!last) return '';
    const textContent = last.content.find(c => c.type === 'text');
    return textContent && textContent.type === 'text' ? textContent.text : '';
  }
}
