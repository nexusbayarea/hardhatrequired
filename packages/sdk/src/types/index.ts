export type Language = 'en' | 'es' | 'zh' | 'vi';

export type DeviceType = 'phone' | 'tablet' | 'desktop';

export type WorkspaceId =
  | 'command'
  | 'search'
  | 'logistics'
  | 'equipment'
  | 'bids'
  | 'markets'
  | 'saved';

export type SearchPane = 'disposal' | 'labor' | 'equipment' | 'regulatory' | 'deep-profiles';

export type ForemanIntent =
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

export interface ForemanRequest {
  message: string;
  workspace?: WorkspaceId;
  device?: DeviceType;
  language?: string;
}

export interface ForemanResponse {
  intent: ForemanIntent;
  actions: PageAction[];
  message?: string;
}

export interface ExtractedIntent {
  intent: ForemanIntent;
  confidence: number;
  params: Record<string, any>;
}

export type ForemanEventName =
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

export interface ForemanEvent {
  name: ForemanEventName;
  timestamp: number;
  payload?: Record<string, unknown>;
  source?: string;
}

export type ForemanEventHandler = (event: ForemanEvent) => void;

export interface AgentContext {
  message: string;
  intent: ForemanIntent;
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

// Equipment Rental Discovery types
export type EquipmentClass =
  | 'vacuum_truck_3k'
  | 'vacuum_truck_5k'
  | 'excavator_heavy'
  | 'end_dump_trailer'
  | 'frac_tank_21k'
  | 'dewatering_pump';

export interface EquipmentRentalSearchRequest {
  latitude: number;
  longitude: number;
  radius_miles?: number;
  equipment_class?: EquipmentClass;
  target_date?: string;
}

export interface EquipmentRentalResult {
  id: string;
  provider_name: string;
  equipment_class: string;
  distance_miles: number;
  daily_rate: number;
  weekly_rate: number | null;
  monthly_rate: number | null;
  delivery_fee: number;
  proximity_score: number;
  trust_index: number;
  composite_confidence_rating: number;
  is_verified_partner: boolean;
  contact_phone: string | null;
  dispatch_email: string | null;
  city: string | null;
  state: string | null;
  operator_included: boolean;
  requires_cdl: boolean;
  minimum_rental_days: number;
}

export interface EquipmentRentalSearchResponse {
  results: EquipmentRentalResult[];
  meta: {
    total: number;
    latitude: number;
    longitude: number;
    radius_miles: number;
    execution_ms: number;
  };
}
