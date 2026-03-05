import type { ToolId } from '../core/types';
import type { ITool, ToolSchema } from '../core/ports/IToolRegistry';

// ─── Tool Category ────────────────────────────────────────────────────────────

export type ToolCategory = 'search' | 'code' | 'file' | 'http' | 'database' | 'custom';

export interface ToolManifest {
  id: ToolId;
  category: ToolCategory;
  version: string;
  author?: string;
  schema: ToolSchema;
}

export interface IToolFactory {
  readonly category: ToolCategory;
  create(config: Record<string, unknown>): ITool;
}
