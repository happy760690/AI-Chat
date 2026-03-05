/**
 * @module core/message
 * @layer core
 *
 * 消息领域模型与消息树结构定义。
 *
 * 职责：
 *   - IMessage：单条消息的数据结构，支持多种内容类型（文本/图片/工具调用/工具结果）
 *   - IMessageTree：以树形结构组织消息，支持消息回溯与分支（branching）
 *   - IMessageRepository：消息持久化端口，由 infrastructure 层实现
 *
 * 约束：
 *   - 只依赖 core/types，不依赖任何其他层
 *   - IMessageTree 使用树结构而非数组，以支持多轮对话回溯
 *   - activePathNodeIds 表示当前激活的对话路径（从根到叶）
 */

import type { MessageId, NodeId, SessionId, Role, MessageContent, StreamStatus } from '../types';

// ─── Message Tree Node ────────────────────────────────────────────────────────

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
  nodes: Map<NodeId, IMessage>;
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
