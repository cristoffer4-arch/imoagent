export interface Property {
  id: string;
  tenant_id: string;
  team_id?: string;
  lat: number;
  lon: number;
  geohash: string;
  freguesia: string;
  concelho: string;
  distrito: string;
  typology: string;
  area_m2: number;
  bedrooms: number;
  bathrooms: number;
  features: Feature[];
  condition: string;
  price_main: number;
  price_min: number;
  price_max: number;
  price_divergence_pct: number;
  portal_count: number;
  sources: Source[];
  first_seen: string;
  last_seen: string;
  derived_recency: number;
  angaria_score: number;
  venda_score: number;
  availability_probability: number;
  top_reasons: Reason[];
  events: MarketEvent[];
  created_at: string;
  updated_at: string;
}

export interface Feature {
  type: string;
  value: boolean | string | number;
}

export interface Source {
  source_type: 'portal' | 'crm' | 'casafari';
  source_name: string;
  last_seen: string;
  url?: string;
  price?: number;
}

export interface Reason {
  reason: string;
  weight: number;
}

export interface MarketEvent {
  type: MarketEventType;
  timestamp: string;
  data: Record<string, any>;
}

export type MarketEventType =
  | 'NEW_ON_MARKET'
  | 'PRICE_DROP'
  | 'PRICE_RISE'
  | 'BACK_ON_MARKET'
  | 'OFF_MARKET'
  | 'NEW_SOURCE_APPEARANCE'
  | 'SOURCE_REMOVED'
  | 'CONTENT_CHANGED'
  | 'PRICE_DIVERGENCE_CHANGED';

export interface SearchFilters {
  mode: 'angariacao' | 'venda';
  location?: {
    concelho?: string;
    freguesia?: string;
    distrito?: string;
    radius_km?: number;
  };
  typology?: string[];
  area_range?: [number, number];
  price_range?: [number, number];
  bedrooms_min?: number;
  bathrooms_min?: number;
  min_score?: number;
  features?: string[];
  availability?: 'high' | 'medium' | 'low';
  sources?: string[];
}

export interface Alert {
  id: string;
  tenant_id: string;
  user_id: string;
  mode: 'angariacao' | 'venda';
  filters: SearchFilters;
  notification_channels: ('email' | 'push' | 'sms')[];
  active: boolean;
  created_at: string;
}

export interface Opportunity {
  id: string;
  tenant_id: string;
  team_id?: string;
  type: 'ANGARIACAO' | 'VENDA';
  status: string;
  pipeline_stage: string;
  property_id: string;
  contact_id?: string;
  owner_user_id: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ACMReport {
  id: string;
  tenant_id: string;
  property_id: string;
  report_data: {
    comparable_properties: Property[];
    price_estimate: number;
    price_range: [number, number];
    market_analysis: string;
  };
  pdf_path?: string;
  created_by: string;
  created_at: string;
}

export interface Contact {
  id: string;
  tenant_id: string;
  team_id?: string;
  contact_type: 'owner' | 'buyer' | 'investor';
  name: string;
  email?: string;
  phone?: string;
  external_ids: Record<string, string>;
  created_at: string;
}

export interface Task {
  id: string;
  tenant_id: string;
  team_id?: string;
  opportunity_id?: string;
  assigned_to?: string;
  task_type: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  tenant_id: string;
  opportunity_id?: string;
  user_id?: string;
  activity_type: 'call' | 'email' | 'whatsapp' | 'visit' | 'note';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ListingAppearance {
  id: string;
  property_entity_id: string;
  source_type: 'portal' | 'crm' | 'casafari';
  source_name: string;
  source_listing_id?: string;
  url?: string;
  source_price?: number;
  source_agency?: string;
  published_at?: string;
  updated_at?: string;
  last_seen: string;
  status: string;
  raw_data?: Record<string, any>;
  created_at: string;
}
