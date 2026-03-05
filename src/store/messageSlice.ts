/**
 * @module store/messageSlice
 * @layer store
 *
 * 消息树状态 Slice，管理每个 Session 的消息树结构。
 *
 * 职责：
 *   - 维护 SessionId → IMessageTree 的映射
 *   - 支持消息追加、流式 delta 更新、分支（branching）
 *   - setActivePath 切换当前激活的对话路径
 *
 * 约束：
 *   - 不调用任何 core/engine，只管理纯状态
 *   - 树结构通过 Map<NodeId, IMessage> 维护，activePathNodeIds 表示当前路径
 */

import type { StateCreator } from 'zustand';
import type { SessionId, StreamStatus, MessageId, NodeId } from '../core/types';
import type { IMessage, IMessageTree } from '../core/message/IMessage';
import type { RootStore } from './types';

export interface MessageSlice {
  trees: Map<SessionId, IMessageTree>;
  appendMessage(sessionId: SessionId, message: IMessage): void;
  updateStreamStatus(sessionId: SessionId, messageId: MessageId, status: StreamStatus): void;
  appendDelta(sessionId: SessionId, messageId: MessageId, delta: string): void;
  branchFrom(sessionId: SessionId, nodeId: NodeId, message: IMessage): void;
  setActivePath(sessionId: SessionId, nodeId: NodeId): void;
  getActivePath(sessionId: SessionId): IMessage[];
}

export const createMessageSlice: StateCreator<RootStore, [], [], MessageSlice> = (set, get) => ({
  trees: new Map(),

  appendMessage(sessionId, message) {
    set(state => {
      const trees = new Map(state.trees);
      const tree = trees.get(sessionId) ?? {
        rootNodeId: message.nodeId,
        nodes: new Map(),
        activePathNodeIds: [],
      };
      const nodes = new Map(tree.nodes);
      nodes.set(message.nodeId, message);
      const activePathNodeIds = [...tree.activePathNodeIds, message.nodeId];
      trees.set(sessionId, { ...tree, nodes, activePathNodeIds });
      return { trees };
    });
  },

  updateStreamStatus(sessionId, messageId, status) {
    set(state => {
      const trees = new Map(state.trees);
      const tree = trees.get(sessionId);
      if (!tree) return {};
      const nodes = new Map(tree.nodes);
      const msg = [...nodes.values()].find(m => m.id === messageId);
      if (!msg) return {};
      nodes.set(msg.nodeId, { ...msg, streamStatus: status });
      trees.set(sessionId, { ...tree, nodes });
      return { trees };
    });
  },

  appendDelta(sessionId, messageId, delta) {
    set(state => {
      const trees = new Map(state.trees);
      const tree = trees.get(sessionId);
      if (!tree) return {};
      const nodes = new Map(tree.nodes);
      const msg = [...nodes.values()].find(m => m.id === messageId);
      if (!msg) return {};
      const content = msg.content.map(c =>
        c.type === 'text' ? { ...c, text: c.text + delta } : c
      );
      nodes.set(msg.nodeId, { ...msg, content });
      trees.set(sessionId, { ...tree, nodes });
      return { trees };
    });
  },

  branchFrom(sessionId, nodeId, message) {
    set(state => {
      const trees = new Map(state.trees);
      const tree = trees.get(sessionId);
      if (!tree) return {};
      const nodes = new Map(tree.nodes);
      nodes.set(message.nodeId, message);
      // 找到 nodeId 在 activePath 中的位置，截断后追加新分支
      const idx = tree.activePathNodeIds.indexOf(nodeId);
      const activePathNodeIds = [
        ...tree.activePathNodeIds.slice(0, idx + 1),
        message.nodeId,
      ];
      trees.set(sessionId, { ...tree, nodes, activePathNodeIds });
      return { trees };
    });
  },

  setActivePath(sessionId, nodeId) {
    set(state => {
      const trees = new Map(state.trees);
      const tree = trees.get(sessionId);
      if (!tree) return {};
      // 重建从 root 到 nodeId 的路径
      const path = buildPathToNode(tree, nodeId);
      trees.set(sessionId, { ...tree, activePathNodeIds: path });
      return { trees };
    });
  },

  getActivePath(sessionId) {
    const tree = get().trees.get(sessionId);
    if (!tree) return [];
    return tree.activePathNodeIds
      .map(id => tree.nodes.get(id))
      .filter((m): m is IMessage => m !== undefined);
  },
});

function buildPathToNode(tree: IMessageTree, targetNodeId: NodeId): NodeId[] {
  const path: NodeId[] = [];
  let current: NodeId | null = targetNodeId;
  while (current) {
    path.unshift(current);
    const node = tree.nodes.get(current);
    current = node?.parentNodeId ?? null;
  }
  return path;
}
