import type { WorkspaceId } from '@/context/WorkspaceContext';
import type { SearchPane } from '@/components/dashboard/SearchConsole';

export type CopilotIntent = 
  | 'search'
  | 'logistics'
  | 'equipment'
  | 'bid'
  | 'compliance'
  | 'navigate'
  | 'translate'
  | 'unknown';

export type PageAction =
  | { type: 'setWorkspace'; value: WorkspaceId }
  | { type: 'setMode'; value: SearchPane }
  | { type: 'setVertical'; value: string }
  | { type: 'setZip'; value: string }
  | { type: 'setRadius'; value: number }
  | { type: 'setGallons'; value: number }
  | { type: 'click'; target: string }
  | { type: 'navigate'; route: string }
  | { type: 'fillForm'; selector: string; value: string }
  | { type: 'openDrawer'; drawer: string }
  | { type: 'closeDrawer'; drawer: string }
  | { type: 'scroll'; direction: 'up' | 'down' | 'to'; target?: string }
  | { type: 'highlight'; selector: string }
  | { type: 'expandCard'; selector: string }
  | { type: 'compareVendors'; vendorIds: string[] }
  | { type: 'showNotification'; message: string; severity: 'info' | 'success' | 'error' }
  | { type: 'searchResults'; results: any[]; count: number };

export interface CopilotRequest {
  message: string;
  workspace?: WorkspaceId;
  device?: 'desktop' | 'tablet' | 'mobile';
  language?: string;
}

export interface CopilotResponse {
  intent: CopilotIntent;
  actions: PageAction[];
  message?: string;
}

export interface ExtractedIntent {
  intent: CopilotIntent;
  confidence: number;
  params: Record<string, any>;
}

export type CopilotEventName =
  | 'SEARCH_STARTED'
  | 'SEARCH_FINISHED'
  | 'VENDOR_OPENED'
  | 'VENDOR_SAVED'
  | 'EQUIPMENT_COMPARED'
  | 'BID_CREATED'
  | 'PROJECT_CREATED'
  | 'PERMIT_VIEWED'
  | 'NAVIGATE'
  | 'WORKSPACE_CHANGED'
  | 'INTENT_ROUTED'
  | 'AGENT_ACTION'
  | 'ERROR'
  | 'LOGISTICS_ESTIMATED'
  | 'COMPLIANCE_CHECKED';

export interface CopilotEvent {
  name: CopilotEventName;
  timestamp: number;
  payload?: Record<string, unknown>;
  source?: string;
}

export type CopilotEventHandler = (event: CopilotEvent) => void;

export interface AgentContext {
  message: string;
  intent: CopilotIntent;
  params: Record<string, any>;
  workspace?: WorkspaceId;
  language?: string;
}

export interface AgentResult {
  success: boolean;
  actions: PageAction[];
  data?: any;
  message?: string;
}
