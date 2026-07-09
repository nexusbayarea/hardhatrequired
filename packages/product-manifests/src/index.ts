import type { ReactNode } from 'react';
import type { WorkspaceId, DeviceType, Language } from '@iie/sdk';

export interface ProductManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  icon?: string;
  modules: ProductModule[];
  workspaces: WorkspaceConfig[];
  defaultWorkspace: WorkspaceId;
  routes: RouteConfig[];
}

export interface ProductModule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  component?: ReactNode;
}

export interface WorkspaceConfig {
  id: WorkspaceId;
  label: string;
  icon: string;
  description: string;
}

export interface RouteConfig {
  path: string;
  moduleId: string;
  label: string;
  showInNav?: boolean;
  exact?: boolean;
}

const registry = new Map<string, ProductManifest>();

export function registerProduct(manifest: ProductManifest): void {
  registry.set(manifest.id, manifest);
}

export function getProduct(id: string): ProductManifest | undefined {
  return registry.get(id);
}

export function getAllProducts(): ProductManifest[] {
  return Array.from(registry.values());
}

export function getProductModules(productId: string): ProductModule[] {
  return registry.get(productId)?.modules || [];
}

export function getActiveModules(productId: string): ProductModule[] {
  return (registry.get(productId)?.modules || []).filter(m => m.enabled);
}

export { hhrManifest } from './hhr';
