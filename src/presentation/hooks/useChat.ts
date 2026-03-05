/**
 * @module presentation/hooks/useChat
 * @layer presentation
 *
 * Chat 核心 hook，连接 Zustand Store 与 AIEngine。
 *
 * 职责：
 *   - sendMessage：构造消息 → 写入 store → 调用 engine → 流式更新 store
 *   - abort：通过 store 的 StreamSlice 中断当前生成
 *   - 维护 streaming 状态供 UI 渲染中断按钮
 *
 * 约束：
 *   - UI 层不直接调用 Adapter，所有模型调用通过 engine
 *   - 副作用（流式消费）在本 hook 内，不泄漏到组件
 */

import { useCallback } from 'react';
import { useStore } from '../../store';
import { getEngine } from '../services/engineService';
import type { SessionId } from '../../core/types';

let msgCounter = 0;

export function useChat(sessionId: SessionId) {
  const appendMessage   = useStore(s => s.appendMessage);
  const appendDelta     = useStore(s => s.appendDelta);
  const updateStatus    = useStore(s => s.updateStreamStatus);
  const setSessionStatus = useStore(s => s.setSessionStatus);
  const createController = useStore(s => s.createController);
  const abortStream     = useStore(s => s.abort);
  const isStreaming     = useStore(s => s.isStreaming(sessionId));

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsgId  = `msg-${++msgCounter}-${Date.now()}`;
    const userNodeId = `node-${userMsgId}`;
    const userMsg = {
      id: userMsgId,
      nodeId: userNodeId,
      parentNodeId: null,
      sessionId,
      role: 'user' as const,
      content: [{ type: 'text' as const, text }],
      createdAt: Date.now(),
      streamStatus: 'done' as const,
    };
    appendMessage(sessionId, userMsg);

    const asstMsgId  = `msg-${++msgCounter}-${Date.now()}`;
    const asstNodeId = `node-${asstMsgId}`;
    const asstMsg = {
      id: asstMsgId,
      nodeId: asstNodeId,
      parentNodeId: userNodeId,
      sessionId,
      role: 'assistant' as const,
      content: [{ type: 'text' as const, text: '' }],
      createdAt: Date.now(),
      streamStatus: 'streaming' as const,
    };
    appendMessage(sessionId, asstMsg);
    setSessionStatus(sessionId, 'running');

    const controller = createController(sessionId);
    const engine = getEngine();

    try {
      const stream = engine.sendMessage({
        sessionId,
        message: userMsg,
        signal: controller.signal,
      });

      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        appendDelta(sessionId, asstMsgId, chunk.delta);
      }

      updateStatus(sessionId, asstMsgId,
        controller.signal.aborted ? 'aborted' : 'done'
      );
    } catch {
      updateStatus(sessionId, asstMsgId, 'error');
    } finally {
      setSessionStatus(sessionId, 'idle');
      useStore.getState().cleanup(sessionId);
    }
  }, [sessionId, appendMessage, appendDelta, updateStatus,
      setSessionStatus, createController]);

  const abort = useCallback(() => {
    abortStream(sessionId);
  }, [sessionId, abortStream]);

  return { sendMessage, abort, isStreaming };
}
