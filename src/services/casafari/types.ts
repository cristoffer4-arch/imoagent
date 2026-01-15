/**
 * Casafari API Types
 * Based on https://docs.api.casafari.com
 */

// Casafari API Response Types
export interface CasafariProperty {
  id: string;
  reference?: string;
  title: string;
  description?: string;
  type: string; // "apartment", "house", "land", "commercial"
  operation: "sale" | "rent";
  price: number;
  currency: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  location: {
    address?: string;
    city: string;
    district?: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  images?: string[];
  features?: string[];
  energyRating?: string;
  publishedAt?: string;
  updatedAt?: string;
  url?: string;
  agent?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

export interface CasafariListResponse {
  data: CasafariProperty[];
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface CasafariSearchParams {
  operation?: "sale" | "rent";
  type?: string[];
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  district?: string;
  page?: number;
  perPage?: number;
}

export interface CasafariApiError {
  error: string;
  message: string;
  statusCode: number;
}

// Canonical Property Model (internal system format)
export interface CanonicalProperty {
  id: string;
  source: "casafari";
  sourceId: string;
  sourceUrl?: string;
  title: string;
  description?: string;
  type: "house" | "apartment" | "land" | "commercial";
  status: "available" | "sold" | "rented" | "pending";
  operation: "sale" | "rent";
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  address?: string;
  city: string;
  state?: string;
  district?: string;
  zipcode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  features?: string[];
  energyRating?: string;
  publishedAt?: Date;
  updatedAt?: Date;
  agentInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  metadata?: Record<string, unknown>;
}

// Service Configuration
export interface CasafariServiceConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  enableCache?: boolean;
  cacheTtl?: number; // Cache time-to-live in seconds
}

// Service Response
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  timestamp?: Date;
}
