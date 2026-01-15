/**
 * NotificationService - Core service for managing notifications
 * Handles property matches, price changes, and real-time alerts
 */

import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { 
  Notification, 
  NotificationPreferences, 
  NotificationType,
  NotificationPriority,
  PropertyMatch,
  PriceChange
} from './notification-types';

class NotificationService {
  private listeners: Map<string, Set<(notification: Notification) => void>> = new Map();
  private notifications: Notification[] = [];
  
  /**
   * Subscribe to notifications of a specific type
   */
  subscribe(type: NotificationType | 'all', callback: (notification: Notification) => void): () => void {
    const key = type;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const set = this.listeners.get(key);
      if (set) {
        set.delete(callback);
      }
    };
  }

  /**
   * Emit a notification to all subscribers
   */
  private emit(notification: Notification): void {
    // Store notification
    this.notifications.unshift(notification);
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Notify 'all' listeners
    this.listeners.get('all')?.forEach(callback => callback(notification));
    
    // Notify type-specific listeners
    this.listeners.get(notification.type)?.forEach(callback => callback(notification));

    // Show browser notification if enabled
    this.showBrowserNotification(notification);
  }

  /**
   * Create a property match notification
   */
  notifyPropertyMatch(match: PropertyMatch, priority: NotificationPriority = 'medium'): void {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'property_match',
      priority,
      title: `Novo Match: ${match.property.title}`,
      message: `Score: ${match.matchScore}/100 - ${match.matchReasons[0] || 'Corresponde aos seus critérios'}`,
      data: match,
      read: false,
      createdAt: new Date(),
    };
    
    this.emit(notification);
  }

  /**
   * Create a price change notification
   */
  notifyPriceChange(change: PriceChange, propertyTitle: string, priority: NotificationPriority = 'high'): void {
    const direction = change.priceDirection === 'down' ? 'Desceu' : 'Subiu';
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'price_change',
      priority,
      title: `Preço ${direction}: ${propertyTitle}`,
      message: `${change.oldPrice.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} → ${change.newPrice.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} (${change.percentageChange.toFixed(1)}%)`,
      data: change,
      read: false,
      createdAt: new Date(),
    };
    
    this.emit(notification);
  }

  /**
   * Create a new property notification
   */
  notifyNewProperty(property: PropertyMatch['property'], priority: NotificationPriority = 'medium'): void {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'new_property',
      priority,
      title: 'Novo Imóvel Disponível',
      message: `${property.title} - ${property.price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}`,
      data: { property },
      read: false,
      createdAt: new Date(),
    };
    
    this.emit(notification);
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
  }

  /**
   * Show browser notification
   */
  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // Check permission
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
        });
      }
    }
  }

  /**
   * Get user notification preferences from Supabase
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching preferences:', error);
        return null;
      }

      return data as unknown as NotificationPreferences;
    } catch (error) {
      console.error('Error in getPreferences:', error);
      return null;
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return false;
    }
  }

  /**
   * Request browser notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    return await Notification.requestPermission();
  }
}

// Singleton instance
export const notificationService = new NotificationService();
