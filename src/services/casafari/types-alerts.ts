/**
 * Casafari Alerts API Types
 * 
 * Type definitions for Casafari Listing Alerts API
 * Documentation: https://docs.api.casafari.com/#tag/api-alerts
 */

/**
 * Alert feed configuration
 * Represents a saved search that generates alerts for new listings
 */
export interface CasafariAlertFeed {
  /** Unique feed identifier */
  id: string;
  
  /** Feed name */
  name: string;
  
  /** Feed description */
  description?: string;
  
  /** Feed filters/criteria */
  filters: CasafariAlertFilters;
  
  /** Feed status */
  status: 'active' | 'paused' | 'deleted';
  
  /** Webhook URL for notifications (optional) */
  webhookUrl?: string;
  
  /** Email for notifications (optional) */
  email?: string;
  
  /** Notification frequency */
  frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly';
  
  /** Creation date */
  createdAt: string; // ISO date
  
  /** Last updated date */
  updatedAt: string; // ISO date
  
  /** Last check date */
  lastCheckedAt?: string; // ISO date
  
  /** Number of alerts generated */
  alertsCount?: number;
  
  /** User/tenant identifier */
  userId?: string;
  
  /** Custom metadata */
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Filters for alert feed configuration
 * Defines the criteria for matching properties
 */
export interface CasafariAlertFilters {
  /** Location filters */
  country?: string;
  district?: string[];
  municipality?: string[];
  parish?: string[];
  postalCode?: string[];
  
  /** Bounding box [minLng, minLat, maxLng, maxLat] */
  bbox?: [number, number, number, number];
  
  /** Polygon coordinates */
  polygon?: Array<[number, number]>;
  
  /** Property type filters */
  propertyType?: string[];
  
  /** Transaction type */
  transactionType?: 'sale' | 'rent';
  
  /** Price range */
  minPrice?: number;
  maxPrice?: number;
  
  /** Area range (m²) */
  minArea?: number;
  maxArea?: number;
  
  /** Gross area range (m²) */
  minGrossArea?: number;
  maxGrossArea?: number;
  
  /** Land area range (m²) */
  minLandArea?: number;
  maxLandArea?: number;
  
  /** Bedrooms */
  minBedrooms?: number;
  maxBedrooms?: number;
  
  /** Bathrooms */
  minBathrooms?: number;
  maxBathrooms?: number;
  
  /** Energy rating */
  energyRating?: string[];
  
  /** Property condition */
  condition?: ('new' | 'used' | 'refurbished')[];
  
  /** Features and amenities */
  hasGarden?: boolean;
  hasPool?: boolean;
  hasBalcony?: boolean;
  hasTerrace?: boolean;
  hasGarage?: boolean;
  hasElevator?: boolean;
  hasAirConditioning?: boolean;
  hasParking?: boolean;
  
  /** Source portals to monitor */
  portals?: string[];
  
  /** Exclude specific agencies */
  excludeAgencies?: string[];
  
  /** Price per square meter range */
  minPricePerSqm?: number;
  maxPricePerSqm?: number;
  
  /** Days on market */
  maxDaysOnMarket?: number;
  
  /** Only new listings (first time published) */
  newListingsOnly?: boolean;
  
  /** Include price changes */
  includePriceChanges?: boolean;
  
  /** Minimum price reduction percentage to alert */
  minPriceReduction?: number;
}

/**
 * Alert subtype - type of change that triggered the alert
 */
export enum CasafariAlertSubtype {
  NEW_LISTING = 'new_listing',
  PRICE_CHANGE = 'price_change',
  PRICE_REDUCTION = 'price_reduction',
  PRICE_INCREASE = 'price_increase',
  BACK_ON_MARKET = 'back_on_market',
  STATUS_CHANGE = 'status_change',
  CONTENT_UPDATE = 'content_update',
  REMOVED = 'removed',
}

/**
 * Individual alert for a property change
 */
export interface CasafariAlert {
  /** Unique alert identifier */
  id: string;
  
  /** Feed that generated this alert */
  feedId: string;
  
  /** Property identifier */
  propertyId: string;
  
  /** Alert type/subtype */
  subtype: CasafariAlertSubtype;
  
  /** Alert creation timestamp */
  createdAt: string; // ISO date
  
  /** Alert status */
  status: 'unread' | 'read' | 'archived' | 'dismissed';
  
  /** Property data snapshot */
  property: {
    id: string;
    propertyType: string;
    transactionType: 'sale' | 'rent';
    
    location: {
      latitude?: number;
      longitude?: number;
      address?: string;
      postalCode?: string;
      parish?: string;
      municipality?: string;
      district?: string;
      country?: string;
    };
    
    price: {
      current: number;
      currency: string;
      previous?: number;
      change?: number;
      changePercentage?: number;
    };
    
    characteristics: {
      netArea?: number;
      grossArea?: number;
      landArea?: number;
      bedrooms?: number;
      bathrooms?: number;
      wc?: number;
      parkingSpaces?: number;
      floor?: number;
      condition?: string;
      energyCertificate?: string;
    };
    
    source: {
      portal?: string;
      portalId?: string;
      url?: string;
      agency?: string;
      agentName?: string;
      agentPhone?: string;
      publishedDate?: string;
      lastUpdated?: string;
    };
    
    images?: Array<{
      url: string;
      order?: number;
    }>;
    
    title?: string;
    description?: string;
  };
  
  /** What changed (for update alerts) */
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  
  /** Match score (how well property matches feed criteria) */
  matchScore?: number;
  
  /** Alert metadata */
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Response for listing alerts
 */
export interface CasafariAlertsResponse {
  /** List of alerts */
  data: CasafariAlert[];
  
  /** Pagination information */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  /** Summary statistics */
  summary?: {
    unreadCount: number;
    totalCount: number;
    bySubtype: {
      [key in CasafariAlertSubtype]?: number;
    };
  };
  
  /** Request metadata */
  meta?: {
    requestId?: string;
    responseTime?: number;
  };
}

/**
 * Response for alert feeds list
 */
export interface CasafariAlertFeedsResponse {
  /** List of feeds */
  data: CasafariAlertFeed[];
  
  /** Pagination information */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  /** Request metadata */
  meta?: {
    requestId?: string;
    responseTime?: number;
  };
}

/**
 * Request to create a new alert feed
 */
export interface CasafariCreateAlertFeedRequest {
  /** Feed name (required) */
  name: string;
  
  /** Feed description */
  description?: string;
  
  /** Feed filters (required) */
  filters: CasafariAlertFilters;
  
  /** Webhook URL for notifications */
  webhookUrl?: string;
  
  /** Email for notifications */
  email?: string;
  
  /** Notification frequency */
  frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly';
  
  /** Feed status */
  status?: 'active' | 'paused';
  
  /** Custom metadata */
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Request to update an existing alert feed
 */
export interface CasafariUpdateAlertFeedRequest {
  /** Feed name */
  name?: string;
  
  /** Feed description */
  description?: string;
  
  /** Feed filters */
  filters?: CasafariAlertFilters;
  
  /** Webhook URL */
  webhookUrl?: string;
  
  /** Email */
  email?: string;
  
  /** Notification frequency */
  frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly';
  
  /** Feed status */
  status?: 'active' | 'paused';
  
  /** Custom metadata */
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Request to search alerts
 */
export interface CasafariSearchAlertsRequest {
  /** Filter by feed IDs */
  feedIds?: string[];
  
  /** Filter by alert status */
  status?: ('unread' | 'read' | 'archived' | 'dismissed')[];
  
  /** Filter by alert subtype */
  subtypes?: CasafariAlertSubtype[];
  
  /** Filter by date range */
  createdAfter?: string; // ISO date
  createdBefore?: string; // ISO date
  
  /** Filter by property type */
  propertyType?: string[];
  
  /** Filter by transaction type */
  transactionType?: 'sale' | 'rent';
  
  /** Filter by location */
  municipality?: string[];
  district?: string[];
  
  /** Filter by price range */
  minPrice?: number;
  maxPrice?: number;
  
  /** Pagination */
  page?: number;
  limit?: number;
  
  /** Sorting */
  sortBy?: 'createdAt' | 'matchScore' | 'price';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Webhook payload for alert notifications
 */
export interface CasafariAlertWebhookPayload {
  /** Webhook event type */
  event: 'alert.created' | 'alert.updated' | 'feed.updated';
  
  /** Event timestamp */
  timestamp: string; // ISO date
  
  /** Feed information */
  feed: {
    id: string;
    name: string;
  };
  
  /** Alert data (for alert events) */
  alert?: CasafariAlert;
  
  /** Batch of alerts (for multiple alerts) */
  alerts?: CasafariAlert[];
  
  /** Webhook signature for verification */
  signature?: string;
}

/**
 * Response for single feed operations
 */
export interface CasafariAlertFeedResponse {
  /** Feed data */
  data: CasafariAlertFeed;
  
  /** Request metadata */
  meta?: {
    requestId?: string;
    responseTime?: number;
  };
}
