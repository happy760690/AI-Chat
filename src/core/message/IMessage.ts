/**
 * @module core/message
 * @layer core
 *
 * 消息领域模型与消息树结构定义。
 *
 * 职责：
 *   - IMessage：单条消息的数据结构
 *   - IMessageTree：树形结构组织消息，支持消息回溯与分支
 *   - IMessageRepository：消息持久化端口
 *
 * 约束：
 *   - nodes 使用 Record 而非 Map，便于 Zustand 状态序列化与 selector 稳定性
 *   - 只依赖 core/types
 */

import type { MessageId, NodeId, SessionId, Role, MessageContent, StreamStatus } from '../types';

export interface IMessage {
  id: MessageId;
  nodeId: NodeId;
  parentNodeId: NodeId | null;
  sessionId: SessionId;
  role: Role;
  content: MessageContent[];
  createdAt: number;
  streamStatus: StreamStatus;
  metadata?: Record<string, unknown>;
}

export interface IMessageTree {
  rootNodeId: NodeId;
  nodes: Record<NodeId, IMessage>;
  activePathNodeIds: NodeId[];
}

export interface IMessageRepository {
  getById(id: MessageId): IMessage | undefined;
  getTree(sessionId: SessionId): IMessageTree | undefined;
  getActivePath(sessionId: SessionId): IMessage[];
  append(message: IMessage): void;
  updateContent(id: MessageId, content: MessageContent[]): void;
  updateStreamStatus(id: MessageId, status: StreamStatus): void;
  branch(fromNodeId: NodeId, newMessage: IMessage): void;
  setActivePath(sessionId: SessionId, nodeId: NodeId): void;
}
