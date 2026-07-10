export { createStore, useStore } from './stores';
export type { Store, Listener } from './stores';

export { EventBus, eventBus } from './event-bus';

export { setDictionary, getDictionary, t } from './localization';
export { LanguageProvider, useLanguage } from './localization/react';
export type { LanguageContextType } from './localization/react';

export { getStoredTheme, setStoredTheme, applyTheme, getPreferredTheme } from './theme';
export { ThemeToggle } from './theme/ThemeToggle';
export type { ThemeToggleProps } from './theme/ThemeToggle';

export { Badge, Button, Card, Input, Select } from './ui';
export type { BadgeProps } from './ui/Badge';
export type { ButtonProps } from './ui/Button';
export type { CardProps } from './ui/Card';
export type { InputProps } from './ui/Input';
export type { SelectProps } from './ui/Select';

export { getSession } from './auth';
export type { AuthUser, AuthState, AuthProvider } from './auth';

export { executeSearch } from './search';
export type { SearchParams, SearchResult, SearchResponse } from './search';

export { searchOntology, getOntologyTree } from './ontology';
export type { OntologyNode, OntologyMatch, VectorSearchResult } from './ontology';

export { PageAgent, pageAgent } from './page-agent';
export type { PageAgentConfig } from './page-agent';

export { sendMessage, extractIntent } from './foreman';

export { ApiClient, ApiError, apiClient } from './api-client';
export type { ApiClientConfig, HttpMethod } from './api-client';

export {
  registerWorkspaceComponent,
  getWorkspaceComponent,
  getWorkspaceComponentIds,
  isOfflineCapable,
  registerSearchProvider,
  getSearchProvider,
  WorkspaceRenderer,
} from './workspace';
export type { WorkspaceComponentEntry, SearchProvider, SearchProviderParams, SearchProviderResult, SearchResultItem, WorkspaceRendererProps } from './workspace';

export type {
  Language, DeviceType, WorkspaceId, SearchPane,
  ForemanIntent, PageAction, ForemanRequest, ForemanResponse,
  ExtractedIntent, ForemanEventName, ForemanEvent,
  ForemanEventHandler, AgentContext, AgentResult,
} from './types';
