export interface SearchProvider {
  id: string;
  name: string;
  execute(params: SearchProviderParams): Promise<SearchProviderResult>;
}

export interface SearchProviderParams {
  query: string;
  vertical?: string;
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
}

export interface SearchProviderResult {
  items: SearchResultItem[];
  total: number;
  page: number;
}

export interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  subtitle?: string;
  score?: number;
  metadata?: Record<string, any>;
}

const searchProviders = new Map<string, SearchProvider>();

export function registerSearchProvider(provider: SearchProvider): void {
  searchProviders.set(provider.id, provider);
}

export function getSearchProvider(id: string): SearchProvider | undefined {
  return searchProviders.get(id);
}

export async function executeSearch(
  providerId: string,
  params: SearchProviderParams
): Promise<SearchProviderResult> {
  const provider = searchProviders.get(providerId);
  if (!provider) throw new Error(`Search provider not found: ${providerId}`);
  return provider.execute(params);
}
