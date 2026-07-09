export {
  registerWorkspaceComponent,
  getWorkspaceComponent,
  getWorkspaceComponentIds,
  isOfflineCapable,
} from './registry';
export type { WorkspaceComponentEntry } from './registry';

export {
  registerSearchProvider,
  getSearchProvider,
  executeSearch,
} from './search-provider';
export type { SearchProvider, SearchProviderParams, SearchProviderResult, SearchResultItem } from './search-provider';

export { WorkspaceRenderer } from './WorkspaceRenderer';
export type { WorkspaceRendererProps } from './WorkspaceRenderer';
