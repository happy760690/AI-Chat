/**
 * @module infrastructure/mock/MockModelAdapter
 * @layer infrastructure
 *
 * Mock 模型适配器，模拟 SSE 流式输出，无需真实后端。
 *
 * 职责：
 *   - 实现 IModelAdapter 接口
 *   - 逐字符模拟流式输出，支持 tool_call 响应模拟
 *   - 响应 AbortSignal 中断
 *
 * 约束：
 *   - 只依赖 core/ports/IModelAdapter 和 core/types
 *   - 仅用于开发/测试，不得在生产环境使用
 */

import type { IModelAdapter, ModelFeatures } from '../../core/ports/IModelAdapter';
import type { ModelConfig, StreamChunk } from '../../core/types';
import type { IMessage } from '../../core/message/IMessage';

const MOCK_RESPONSES = [
  '你好！我是 AI 助手，很高兴为你服务。',
  '这是一个很好的问题。让我来详细解释一下...',
  '根据你的描述，我建议可以从以下几个方面考虑：\n\n1. 首先分析问题的核心\n2. 然后制定解决方案\n3. 最后验证结果',
  '我理解你的需求。这个问题涉及到多个层面，需要综合考虑。',
];

export class MockModelAdapter implements IModelAdapter {
  readonly modelId: string;
  readonly supportedFeatures: ModelFeatures = {
    streaming: true,
    toolCalling: true,
    vision: false,
    systemPrompt: true,
  };

  constructor(modelId = 'mock-gpt-4') {
    this.modelId = modelId;
  }

  async *chat(
    messages: IMessage[],
    _config: ModelConfig,
    signal: AbortSignal
  ): AsyncIterable<StreamChunk> {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const text = lastUser?.content.find(c => c.type === 'text');
    const query = text && text.type === 'text' ? text.text.toLowerCase() : '';

    // 模拟 tool_call 触发
    if (query.includes('搜索') || query.includes('search')) {
      yield* this.mockToolCallStream(signal);
      return;
    }

    const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
    yield* this.mockTextStream(response, signal);
  }

  async countTokens(messages: IMessage[], _config: ModelConfig): Promise<number> {
    return messages.reduce((acc, m) => {
      return acc + m.content.reduce((a, c) => {
        return a + (c.type === 'text' ? c.text.length / 4 : 10);
      }, 0);
    }, 0);
  }

  private async *mockTextStream(
    text: string,
    signal: AbortSignal
  ): AsyncIterable<StreamChunk> {
    const chars = text.split('');
    for (let i = 0; i < chars.length; i++) {
      if (signal.aborted) return;
      await delay(30);
      yield { delta: chars[i], index: i };
    }
  }

  private async *mockToolCallStream(signal: AbortSignal): AsyncIterable<StreamChunk> {
    const prefix = '正在调用搜索工具...';
    yield* this.mockTextStream(prefix, signal);
    if (signal.aborted) return;
    // 模拟 tool_call chunk（实际适配器会解析为 ToolCallContent）
    yield {
      delta: JSON.stringify({
        type: 'tool_call',
        toolId: 'web-search',
        callId: `call-${Date.now()}`,
        input: { query: 'mock search' },
      }),
      index: prefix.length,
      finishReason: 'tool_calls',
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
