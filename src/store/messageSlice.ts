/**
 * @module store/messageSlice
 * @layer store
 *
 * 消息树状态 Slice。
 * 用 Record<SessionId, IMessageTree> 替代 Map，避免 Zustand selector 无限循环。
 */

import type { StateCreator } from 'zustand';
import type { SessionId, StreamStatus, MessageId, NodeId } from '../core/types';
import type { IMessage, IMessageTree } from '../core/message/IMessage';
import type { RootStore } from './types';

export interface MessageSlice {
  trees: Record<SessionId, IMessageTree>;
  appendMessage(sessionId: SessionId, message: IMessage): void;
  updateStreamStatus(sessionId: SessionId, messageId: MessageId, status: StreamStatus): void;
  appendDelta(sessionId: SessionId, messageId: MessageId, delta: string): void;
  branchFrom(sessionId: SessionId, nodeId: NodeId, message: IMessage): void;
  setActivePath(sessionId: SessionId, nodeId: NodeId): void;
  getActivePath(sessionId: SessionId): IMessage[];
}

const emptyTree = (rootNodeId: NodeId): IMessageTree => ({
  rootNodeId,
  nodes: {},
  activePathNodeIds: [],
});

export const createMessageSlice: StateCreator<RootStore, [], [], MessageSlice> = (set, get) => ({
  trees: {},

  appendMessage(sessionId, message) {
    set(state => {
      const tree = state.trees[sessionId] ?? emptyTree(message.nodeId);
      return {
        trees: {
          ...state.trees,
          [sessionId]: {
            ...tree,
            nodes: { ...tree.nodes, [message.nodeId]: message },
            activePathNodeIds: [...tree.activePathNodeIds, message.nodeId],
          },
        },
      };
    });
  },

  updateStreamStatus(sessionId, messageId, status) {
    set(state => {
      const tree = state.trees[sessionId];
      if (!tree) return {};
      const node = Object.values(tree.nodes).find(m => m.id === messageId);
      if (!node) return {};
      return {
        trees: {
          ...state.trees,
          [sessionId]: {
            ...tree,
            nodes: { ...tree.nodes, [node.nodeId]: { ...node, streamStatus: status } },
          },
        },
      };
    });
  },

  appendDelta(sessionId, messageId, delta) {
    set(state => {
      const tree = state.trees[sessionId];
      if (!tree) return {};
      const node = Object.values(tree.nodes).find(m => m.id === messageId);
      if (!node) return {};
      const content = node.content.map(c =>
        c.type === 'text' ? { ...c, text: c.text + delta } : c
      );
      return {
        trees: {
          ...state.trees,
          [sessionId]: {
            ...tree,
            nodes: { ...tree.nodes, [node.nodeId]: { ...node, content } },
          },
        },
      };
    });
  },

  branchFrom(sessionId, nodeId, message) {
    set(state => {
      const tree = state.trees[sessionId];
      if (!tree) return {};
      const idx = tree.activePathNodeIds.indexOf(nodeId);
      const activePathNodeIds = [
        ...tree.activePathNodeIds.slice(0, idx + 1),
        message.nodeId,
      ];
      return {
        trees: {
          ...state.trees,
          [sessionId]: {
            ...tree,
            nodes: { ...tree.nodes, [message.nodeId]: message },
            activePathNodeIds,
          },
        },
      };
    });
  },

  setActivePath(sessionId, nodeId) {
    set(state => {
      const tree = state.trees[sessionId];
      if (!tree) return {};
      const path = buildPathToNode(tree, nodeId);
      return {
        trees: {
          ...state.trees,
          [sessionId]: { ...tree, activePathNodeIds: path },
        },
      };
    });
  },

  getActivePath(sessionId) {
    const tree = get().trees[sessionId];
    if (!tree) return [];
    return tree.activePathNodeIds
      .map(id => tree.nodes[id])
      .filter((m): m is IMessage => m !== undefined);
  },
});

function buildPathToNode(tree: IMessageTree, targetNodeId: NodeId): NodeId[] {
  const path: NodeId[] = [];
  let current: NodeId | null = targetNodeId;
  while (current) {
    path.unshift(current);
    const node: IMessage | undefined = tree.nodes[current];
    current = node?.parentNodeId ?? null;
  }
  return path;
}
