import type { ModelId } from '../core/types';
import type { IModelAdapter } from '../core/ports/IModelAdapter';

// ─── Adapter Registry ─────────────────────────────────────────────────────────

export interface IAdapterRegistry {
  register(adapter: IModelAdapter): void;
  unregister(modelId: ModelId): void;
  get(modelId: ModelId): IModelAdapter | undefined;
  getAll(): IModelAdapter[];
  getSupportedModelIds(): ModelId[];
}
