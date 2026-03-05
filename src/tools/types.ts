/**
 * @module tools
 * @layer tools
 *
 * Tool 工厂与 Manifest 定义，管理工具的元数据与创建逻辑。
 *
 * 职责：
 *   - ToolManifest：工具的静态描述（分类、版本、作者、schema）
 *   - IToolFactory：按分类创建工具实例，支持配置注入
 *
 * 约束：
 *   - 只依赖 core/types 和 core/ports/IToolRegistry
 *   - 工具实现文件（SearchTool / CodeTool 等）在本层各自文件中
 *   - IToolFactory 不持有状态，每次 create() 返回新实例
 *
 * 依赖方向：tools → core（单向）
 */

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
