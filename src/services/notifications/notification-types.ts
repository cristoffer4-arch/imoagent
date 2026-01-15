/**
 * Types for the Notification Service
 * Handles property matches, price changes, and new properties
 */

export type NotificationType = 
  | 'property_match' 
  | 'price_change' 
  | 'new_property' 
  | 'availability_change'
  | 'alert_triggered';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface PropertyMatch {
  propertyId: string;
  matchScore: number;
  matchReasons: string[];
  property: {
    id: string;
    title: string;
    price: number;
    area: number;
    bedrooms: number;
    bathrooms: number;
    location: string;
    images: string[];
    angariaScore?: number;
    vendaScore?: number;
  };
}

export interface PriceChange {
  propertyId: string;
  oldPrice: number;
  newPrice: number;
  percentageChange: number;
  priceDirection: 'up' | 'down';
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: PropertyMatch | PriceChange | Record<string, unknown>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  enableNotifications: boolean;
  enableSound: boolean;
  enableDesktop: boolean;
  notificationTypes: {
    propertyMatch: boolean;
    priceChange: boolean;
    newProperty: boolean;
    availabilityChange: boolean;
  };
  filters: {
    minMatchScore: number;
    minPriceChange: number;
    locations: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

export interface NotificationEvent {
  type: NotificationType;
  payload: unknown;
  timestamp: Date;
}

export interface WebSocketMessage {
  event: 'notification' | 'ping' | 'pong' | 'subscribe' | 'unsubscribe';
  data?: unknown;
}
