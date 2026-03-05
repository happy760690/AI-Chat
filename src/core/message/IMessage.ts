import type { MessageId, NodeId, SessionId, Role, MessageContent, StreamStatus } from '../types';

// ─── Message Tree Node (支持消息回溯树结构) ────────────────────────────────────

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
