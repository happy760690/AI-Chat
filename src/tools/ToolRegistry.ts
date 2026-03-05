/**
 * @module tools/ToolRegistry
 * @layer tools
 *
 * Tool 注册器实现，维护工具 ID 到 ITool 实例的映射。
 *
 * 职责：
 *   - 工具的注册、注销、按 ID 查询
 *   - getSchemas() 返回所有工具的 JSON Schema，供 LLM function calling 使用
 *
 * 约束：
 *   - 只依赖 core/ports/IToolRegistry
 *   - 不持有任何执行逻辑，执行由 ToolExecutor 负责
 *   - 可单元测试：纯内存操作，无副作用
 *
 * 依赖方向：tools → core（单向）
 */

import type { ITool, IToolRegistry, ToolSchema } from '../core/ports/IToolRegistry';
import type { ToolId } from '../core/types';

export class ToolRegistry implements IToolRegistry {
  private readonly tools = new Map<ToolId, ITool>();

  register(tool: ITool): void {
    this.tools.set(tool.schema.id, tool);
  }

  unregister(toolId: ToolId): void {
    this.tools.delete(toolId);
  }

  get(toolId: ToolId): ITool | undefined {
    return this.tools.get(toolId);
  }

  getAll(): ITool[] {
    return Array.from(this.tools.values());
  }

  getSchemas(): ToolSchema[] {
    return this.getAll().map(t => t.schema);
  }
}
