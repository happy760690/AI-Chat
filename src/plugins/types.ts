import type { PluginId } from '../core/types';
import type { IPlugin, PluginLifecycleHook } from '../core/ports/IPluginManager';

// ─── Plugin Manifest ──────────────────────────────────────────────────────────

export interface PluginManifest {
  id: PluginId;
  name: string;
  version: string;
  description: string;
  hooks: PluginLifecycleHook[];
  configSchema?: Record<string, unknown>;
}

export interface IPluginFactory {
  readonly manifest: PluginManifest;
  create(config: Record<string, unknown>): IPlugin;
}
