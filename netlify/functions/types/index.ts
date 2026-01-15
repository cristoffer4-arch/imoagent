// ========================================
// ENUMS
// ========================================

export enum SourceType {
  PORTAL = 'PORTAL',
  CRM = 'CRM',
  CASAFARI = 'CASAFARI',
  MANUAL = 'MANUAL',
}

export enum EventType {
  NEW_ON_MARKET = 'NEW_ON_MARKET',
  PRICE_DROP = 'PRICE_DROP',
  BACK_ON_MARKET = 'BACK_ON_MARKET',
  OFF_MARKET = 'OFF_MARKET',
  PRICE_INCREASE = 'PRICE_INCREASE',
}

export enum OpportunityType {
  ANGARIACAO = 'ANGARIACAO',
  VENDA = 'VENDA',
}

export enum OpportunityStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  IN_NEGOTIATION = 'IN_NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ConnectorType {
  PORTAL_IDEALISTA = 'PORTAL_IDEALISTA',
  PORTAL_IMOVIRTUAL = 'PORTAL_IMOVIRTUAL',
  PORTAL_OLX = 'PORTAL_OLX',
  PORTAL_FACEBOOK = 'PORTAL_FACEBOOK',
  CASAFARI = 'CASAFARI',
  CRM_GENERIC = 'CRM_GENERIC',
}

export enum IntegrationStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum ContactType {
  OWNER = 'OWNER',
  BUYER = 'BUYER',
  AGENT = 'AGENT',
  OTHER = 'OTHER',
}

export enum AlertType {
  NEW_PROPERTY = 'NEW_PROPERTY',
  PRICE_DROP = 'PRICE_DROP',
  MARKET_EVENT = 'MARKET_EVENT',
  OPPORTUNITY = 'OPPORTUNITY',
}

// ========================================
// MAIN ENTITIES
// ========================================

export interface PropertyEntity {
  id: string;
  tenant_id: string;
  team_id?: string;
  lat?: number;
  lon?: number;
  geohash?: string;
  freguesia?: string;
  concelho?: string;
  distrito?: string;
  typology?: string;
  area_m2?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: Record<string, any>;
  condition?: string;
  price_main?: number;
  price_min?: number;
  price_max?: number;
  price_divergence_pct?: number;
  portal_count?: number;
  sources?: Record<string, any>;
  first_seen?: string;
  last_seen?: string;
  derived_recency?: number;
  angaria_score?: number;
  venda_score?: number;
  availability_probability?: number;
  top_reasons?: Record<string, any>;
  events?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface ListingAppearance {
  id: string;
  property_entity_id: string;
  source_type: SourceType;
  source_name: string;
  source_listing_id: string;
  url?: string;
  source_price?: number;
  source_agency?: string;
  published_at?: string;
  updated_at?: string;
  last_seen?: string;
  status?: string;
}

export interface Contact {
  id: string;
  tenant_id: string;
  team_id?: string;
  contact_type: ContactType;
  name?: string;
  email?: string;
  phone?: string;
  external_ids?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Opportunity {
  id: string;
  tenant_id: string;
  team_id?: string;
  type: OpportunityType;
  status: OpportunityStatus;
  pipeline_stage?: string;
  property_id?: string;
  contact_id?: string;
  owner_user_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  tenant_id: string;
  team_id?: string;
  opportunity_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  details?: Record<string, any>;
  user_id?: string;
  created_at?: string;
}

export interface Alert {
  id: string;
  tenant_id: string;
  team_id?: string;
  user_id?: string;
  alert_type: AlertType;
  filters?: Record<string, any>;
  is_active: boolean;
  last_triggered?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ACMReport {
  id: string;
  tenant_id: string;
  property_id: string;
  report_data?: Record<string, any>;
  pdf_url?: string;
  created_at?: string;
}

export interface MarketEvent {
  id: string;
  property_id: string;
  event_type: EventType;
  event_data?: Record<string, any>;
  created_at?: string;
}

export interface PropertyEmbedding {
  id: string;
  property_id: string;
  text_embedding?: number[];
  quality_score?: number;
  sinal_particular?: string;
  created_at?: string;
}

export interface ImageHash {
  id: string;
  listing_appearance_id: string;
  image_phash: string;
  created_at?: string;
}

// ========================================
// INGESTION ENTITIES
// ========================================

export interface RawPortalEvent {
  id: string;
  source_name: string;
  raw_data: Record<string, any>;
  processed: boolean;
  created_at?: string;
}

export interface RawCRMEvent {
  id: string;
  crm_name: string;
  raw_data: Record<string, any>;
  processed: boolean;
  created_at?: string;
}

export interface RawCasafariEvent {
  id: string;
  raw_data: Record<string, any>;
  processed: boolean;
  created_at?: string;
}

export interface IntegrationJob {
  id: string;
  connector_type: ConnectorType;
  status: IntegrationStatus;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

// ========================================
// CONNECTOR INTERFACES
// ========================================

export interface PullResult {
  success: boolean;
  records_count: number;
  error?: string;
  data?: any[];
}

export interface PushData {
  properties?: PropertyEntity[];
  contacts?: Contact[];
  opportunities?: Opportunity[];
}

export interface PushResult {
  success: boolean;
  pushed_count: number;
  error?: string;
}

export interface WebhookEvent {
  source: string;
  event_type: string;
  payload: Record<string, any>;
  timestamp?: string;
}

export interface WebhookResult {
  success: boolean;
  processed: boolean;
  error?: string;
}

// ========================================
// SCORES
// ========================================

export interface Scores {
  angaria_score: number;
  venda_score: number;
  availability_probability: number;
  confidence: number;
}

// ========================================
// NORMALIZED PROPERTY
// ========================================

export interface NormalizedProperty {
  lat?: number;
  lon?: number;
  geohash?: string;
  freguesia?: string;
  concelho?: string;
  distrito?: string;
  typology?: string;
  area_m2?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: Record<string, any>;
  condition?: string;
  price?: number;
  source_type: SourceType;
  source_name: string;
  source_listing_id: string;
  url?: string;
}

// ========================================
// REQUEST/RESPONSE TYPES
// ========================================

export interface SearchFilters {
  mode?: 'angariacao' | 'venda';
  typology?: string;
  distrito?: string;
  concelho?: string;
  freguesia?: string;
  price_min?: number;
  price_max?: number;
  bedrooms?: number;
  area_min?: number;
  area_max?: number;
  features?: string[];
}

export interface SearchResponse {
  properties: PropertyEntity[];
  total: number;
  page: number;
  per_page: number;
}

export interface PropertyDetailResponse {
  property: PropertyEntity;
  listing_appearances: ListingAppearance[];
  market_events: MarketEvent[];
  opportunities: Opportunity[];
}
