/**
 * Notification Types - Sistema de Notificações em Tempo Real
 * Para alertas de matches, novas propriedades, mudanças de preço
 */

export enum NotificationType {
  PROPERTY_MATCH = 'PROPERTY_MATCH',
  NEW_PROPERTY = 'NEW_PROPERTY',
  PRICE_DROP = 'PRICE_DROP',
  PRICE_INCREASE = 'PRICE_INCREASE',
  BACK_ON_MARKET = 'BACK_ON_MARKET',
  OFF_MARKET = 'OFF_MARKET',
  ALERT_TRIGGERED = 'ALERT_TRIGGERED',
  OPPORTUNITY_CREATED = 'OPPORTUNITY_CREATED',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface MatchScore {
  overall: number; // 0-100
  locationScore: number;
  priceScore: number;
  featuresScore: number;
  reasons: string[];
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  propertyId?: string;
  matchScore?: MatchScore;
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  enablePropertyMatches: boolean;
  enableNewProperties: boolean;
  enablePriceChanges: boolean;
  enableMarketEvents: boolean;
  minMatchScore: number; // 0-100
  notificationChannels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
}

export interface WebSocketMessage {
  event: string;
  data: any;
  timestamp: number;
}

export interface NotificationFilter {
  types?: NotificationType[];
  priorities?: NotificationPriority[];
  unreadOnly?: boolean;
  propertyId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}
