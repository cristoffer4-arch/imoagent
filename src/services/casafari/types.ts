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
 * Search/List filters for properties
 */
export interface CasafariSearchFilters {
  // Location filters
  country?: string;
  district?: string;
  municipality?: string;
  parish?: string;
  postalCode?: string;
  
  // Property filters
  propertyType?: string[];
  transactionType?: 'sale' | 'rent';
  
  // Price filters
  minPrice?: number;
  maxPrice?: number;
  
  // Area filters (in m²)
  minArea?: number;
  maxArea?: number;
  
  // Characteristics
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Sorting
  sortBy?: 'price' | 'area' | 'publishedDate' | 'lastUpdated';
  sortOrder?: 'asc' | 'desc';
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
