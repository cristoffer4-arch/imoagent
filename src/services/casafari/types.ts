/**
 * Casafari API Types - Based on https://docs.api.casafari.com
 * 
 * Type definitions for Casafari API requests and responses
 */

/**
 * Casafari API Configuration
 */
export interface CasafariConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

/**
 * Floor position types
 */
export type CasafariFloor = 'no_floor' | 'ground' | 'middle' | 'top';

/**
 * View types
 */
export type CasafariView = 'water' | 'landscape' | 'city' | 'golf' | 'park';

/**
 * Direction types (cardinal directions)
 */
export type CasafariDirection = 'north' | 'south' | 'east' | 'west';

/**
 * Orientation types
 */
export type CasafariOrientation = 'exterior' | 'interior';

/**
 * Property condition types
 */
export type CasafariCondition = 'used' | 'ruin' | 'very-good' | 'new' | 'other';

/**
 * Energy rating types
 */
export type CasafariEnergyRating = 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

/**
 * Sort order types
 */
export type CasafariSortOrder = 'asc' | 'desc';

/**
 * Sort by field types
 */
export type CasafariSortBy = 
  | 'price' 
  | 'price_per_sqm' 
  | 'total_area' 
  | 'bedrooms' 
  | 'construction_year' 
  | 'last_update' 
  | 'time_on_market';

/**
 * Property characteristics filters
 */
export interface CasafariCharacteristics {
  must_have?: string[];
  exclude?: string[];
}

/**
 * Custom location boundary - circle
 */
export interface CasafariLocationCircle {
  type: 'circle';
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters
}

/**
 * Custom location boundary - polygon
 */
export interface CasafariLocationPolygon {
  type: 'polygon';
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
}

/**
 * Custom location boundary (union type)
 */
export type CasafariLocationBoundary = CasafariLocationCircle | CasafariLocationPolygon;

/**
 * Search/List filters for properties
 */
export interface CasafariSearchFilters {
  // Location filters
  country?: string;
  district?: string;
  municipality?: string;
  parish?: string;
  postalCode?: string;
  location_ids?: string[]; // Advanced: specific location IDs
  custom_location_boundary?: CasafariLocationBoundary; // Advanced: circle or polygon
  
  // Property filters
  propertyType?: string[];
  transactionType?: 'sale' | 'rent';
  
  // Price filters
  minPrice?: number;
  maxPrice?: number;
  price_per_sqm_from?: number; // Advanced: minimum price per square meter
  price_per_sqm_to?: number;   // Advanced: maximum price per square meter
  
  // Area filters (in m²)
  minArea?: number;
  maxArea?: number;
  plot_area_from?: number; // Advanced: minimum plot/land area
  plot_area_to?: number;   // Advanced: maximum plot/land area
  
  // Characteristics - Bedrooms & Bathrooms
  minBedrooms?: number;
  maxBedrooms?: number;
  bedrooms?: number; // Exact number
  minBathrooms?: number;
  maxBathrooms?: number;
  bathrooms_from?: number; // Advanced: minimum bathrooms
  bathrooms_to?: number;   // Advanced: maximum bathrooms
  
  // Floor information
  minFloors?: number;
  maxFloors?: number;
  floors?: CasafariFloor[]; // Advanced: floor position (ground, middle, top, etc.)
  floor_number?: number[];  // Advanced: specific floor numbers
  
  // Additional area filters
  minLandArea?: number;
  maxLandArea?: number;
  minGrossArea?: number;
  maxGrossArea?: number;
  
  // Features and amenities
  hasGarden?: boolean;
  hasPool?: boolean;
  hasBalcony?: boolean;
  hasTerrace?: boolean;
  hasGarage?: boolean;
  hasElevator?: boolean;
  hasAirConditioning?: boolean;
  hasParking?: boolean;
  
  // Property condition and characteristics
  energyRating?: string[]; // e.g., ['A', 'A+', 'B'] (legacy)
  energy_ratings?: CasafariEnergyRating[]; // Advanced: typed energy ratings
  condition?: ('new' | 'used' | 'refurbished')[]; // Legacy
  conditions?: CasafariCondition[]; // Advanced: typed conditions
  orientation?: string[]; // e.g., ['north', 'south', 'east', 'west'] (legacy)
  orientations?: CasafariOrientation; // Advanced: 'exterior' | 'interior'
  views?: string[]; // e.g., ['sea', 'mountain', 'city'] (legacy)
  view_types?: CasafariView[]; // Advanced: typed views
  directions?: CasafariDirection[]; // Advanced: cardinal directions
  characteristics?: CasafariCharacteristics; // Advanced: must_have/exclude filters
  furnished?: boolean;
  
  // Construction year
  construction_year_from?: number; // Advanced: minimum construction year
  construction_year_to?: number;   // Advanced: maximum construction year
  
  // Market metrics
  days_on_market_from?: number; // Advanced: minimum days on market
  days_on_market_to?: number;   // Advanced: maximum days on market
  gross_yield_from?: number;    // Advanced: minimum gross yield (%)
  gross_yield_to?: number;      // Advanced: maximum gross yield (%)
  
  // Business filters
  private?: boolean;           // Advanced: private listings only
  auction?: boolean;           // Advanced: auction listings only
  bank?: boolean;              // Advanced: bank-owned properties only
  casafari_connect?: boolean;  // Advanced: Casafari Connect listings
  exclusive?: boolean;         // Advanced: exclusive listings
  with_agencies?: string[];    // Advanced: filter by specific agency IDs
  without_agencies?: string[]; // Advanced: exclude specific agency IDs
  listing_agents?: string[];   // Advanced: filter by agent IDs
  ref_numbers?: string[];      // Advanced: filter by reference numbers
  
  // Date filters
  publishedAfter?: string; // ISO date string (legacy)
  publishedBefore?: string; // ISO date string (legacy)
  updatedAfter?: string; // ISO date string (legacy)
  updatedBefore?: string; // ISO date string (legacy)
  property_date_from?: string; // Advanced: property listing date from
  property_date_to?: string;   // Advanced: property listing date to
  created_date_from?: string;  // Advanced: record creation date from
  created_date_to?: string;    // Advanced: record creation date to
  updated_date_from?: string;  // Advanced: last update date from
  updated_date_to?: string;    // Advanced: last update date to
  
  // Pagination
  page?: number;
  limit?: number;
  perPage?: number; // Alternative to limit
  
  // Sorting
  sortBy?: 'price' | 'area' | 'publishedDate' | 'lastUpdated'; // Legacy
  sortOrder?: 'asc' | 'desc'; // Legacy
  order?: CasafariSortOrder;  // Advanced: sort order
  order_by?: CasafariSortBy;  // Advanced: sort field
}

/**
 * Casafari API Response for list/search operations
 */
export interface CasafariListResponse {
  data: CasafariProperty[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    requestId?: string;
    responseTime?: number;
  };
}

/**
 * Casafari API Response for single property
 */
export interface CasafariDetailResponse {
  data: CasafariProperty;
  meta?: {
    requestId?: string;
    responseTime?: number;
  };
}

/**
 * Casafari Property data structure
 * Based on Casafari API documentation
 */
export interface CasafariProperty {
  id: string;
  propertyType?: string;
  transactionType?: string;
  
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    postalCode?: string;
    parish?: string;
    municipality?: string;
    district?: string;
    country?: string;
  };
  
  price?: {
    value?: number;
    currency?: string;
    pricePerSqm?: number;
    condominium?: number;
  };
  
  characteristics?: {
    grossArea?: number;
    netArea?: number;
    landArea?: number;
    bedrooms?: number;
    bathrooms?: number;
    wc?: number;
    rooms?: number;
    parkingSpaces?: number;
    floor?: number;
    totalFloors?: number;
    condition?: string;
    energyCertificate?: string;
    typology?: string;
  };
  
  features?: {
    [key: string]: boolean;
  };
  
  title?: string;
  description?: string;
  
  images?: Array<{
    url: string;
    order?: number;
    caption?: string;
  }>;
  
  source?: {
    portal?: string;
    portalId?: string;
    url?: string;
    agency?: string;
    agentName?: string;
    agentPhone?: string;
    agentEmail?: string;
    publishedDate?: string;
    lastUpdated?: string;
  };
  
  metadata?: {
    views?: number;
    daysOnMarket?: number;
    priceHistory?: Array<{
      date: string;
      price: number;
    }>;
    [key: string]: any;
  };
}

/**
 * Casafari API Error Response
 */
export interface CasafariErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId?: string;
  };
}

/**
 * Cache entry structure
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}
