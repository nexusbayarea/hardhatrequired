export interface PseoRoute {
  state_slug: string;
  city_slug: string;
  vertical_slug: string;
}

export interface PseoVendor {
  id: string;
  company_name: string;
  trust_score: number;
  verified_badges: string[] | null;
  lat: number;
  lng: number;
}

export interface PseoBid {
  opp_id: string;
  date: string;
}

export interface PseoPageData {
  vertical_id: string;
  vertical_name: string;
  vendors: PseoVendor[];
  recent_regional_bids: PseoBid[];
}
