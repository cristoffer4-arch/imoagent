/**
 * AlertNotificationService - Real-time notification system for property alerts
 * 
 * This service handles:
 * - Push notifications for new property alerts
 * - Webhook processing for real-time updates
 * - Alert aggregation and batching
 * - Notification preferences and delivery
 * 
 * Features:
 * - Multiple notification channels (email, push, webhook)
 * - Rate limiting and batching
 * - Retry logic for failed deliveries
 * - Alert prioritization
 */

import type {
  CasafariAlert,
  CasafariAlertFeed,
  CasafariAlertWebhookPayload,
  CasafariAlertSubtype,
} from '../casafari/types-alerts';

/**
 * Notification channel types
 */
export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  WEBHOOK = 'webhook',
  SMS = 'sms',
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Notification preferences for a user/feed
 */
export interface NotificationPreferences {
  /** User identifier */
  userId: string;
  
  /** Enabled notification channels */
  channels: NotificationChannel[];
  
  /** Email address for notifications */
  email?: string;
  
  /** Phone number for SMS (optional) */
  phone?: string;
  
  /** Push notification tokens */
  pushTokens?: string[];
  
  /** Webhook URL */
  webhookUrl?: string;
  
  /** Notification frequency */
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  
  /** Quiet hours (no notifications during this time) */
  quietHours?: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  
  /** Alert subtypes to notify about */
  subtypes?: CasafariAlertSubtype[];
  
  /** Minimum priority to notify */
  minPriority?: NotificationPriority;
  
  /** Batch notifications */
  batchEnabled?: boolean;
  
  /** Maximum batch size */
  maxBatchSize?: number;
}

/**
 * Notification message
 */
export interface NotificationMessage {
  /** Unique notification ID */
  id: string;
  
  /** Alert that triggered the notification */
  alert: CasafariAlert;
  
  /** Feed information */
  feed: CasafariAlertFeed;
  
  /** Priority */
  priority: NotificationPriority;
  
  /** Notification channels to use */
  channels: NotificationChannel[];
  
  /** Formatted message content */
  content: {
    title: string;
    body: string;
    summary?: string;
    actionUrl?: string;
  };
  
  /** Timestamp */
  createdAt: string; // ISO date
  
  /** Delivery status */
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  
  /** Retry count */
  retryCount?: number;
  
  /** Error message (if failed) */
  error?: string;
}

/**
 * Alert Notification Service
 */
export class AlertNotificationService {
  private notificationQueue: NotificationMessage[] = [];
  private batchIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Process a new alert and send notifications
   * 
   * @param alert - Alert to process
   * @param feed - Feed that generated the alert
   * @param preferences - User notification preferences
   * 
   * @example
   * ```typescript
   * const service = new AlertNotificationService();
   * 
   * await service.processAlert(alert, feed, {
   *   userId: 'user-123',
   *   channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
   *   email: 'consultant@example.com',
   *   frequency: 'realtime',
   *   subtypes: ['new_listing', 'price_reduction']
   * });
   * ```
   */
  async processAlert(
    alert: CasafariAlert,
    feed: CasafariAlertFeed,
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      // Check if alert matches notification preferences
      if (!this.shouldNotify(alert, preferences)) {
        console.log(`[AlertNotificationService] Skipping notification for alert ${alert.id}`);
        return;
      }

      // Determine priority
      const priority = this.determinePriority(alert);

      // Check if we're in quiet hours
      if (this.isQuietHours(preferences) && priority !== NotificationPriority.URGENT) {
        console.log('[AlertNotificationService] In quiet hours, queueing notification');
        this.queueNotification(alert, feed, preferences, priority);
        return;
      }

      // Create notification message
      const notification = this.createNotification(alert, feed, preferences, priority);

      // Handle batching
      if (preferences.batchEnabled && preferences.frequency !== 'realtime') {
        this.addToBatch(notification, preferences);
      } else {
        // Send immediately
        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error('[AlertNotificationService] Error processing alert:', error);
      throw error;
    }
  }

  /**
   * Send a notification through configured channels
   * 
   * @param notification - Notification to send
   */
  async sendNotification(notification: NotificationMessage): Promise<void> {
    const results: { channel: NotificationChannel; success: boolean }[] = [];

    for (const channel of notification.channels) {
      try {
        switch (channel) {
          case NotificationChannel.EMAIL:
            await this.sendEmailNotification(notification);
            results.push({ channel, success: true });
            break;

          case NotificationChannel.PUSH:
            await this.sendPushNotification(notification);
            results.push({ channel, success: true });
            break;

          case NotificationChannel.WEBHOOK:
            await this.sendWebhookNotification(notification);
            results.push({ channel, success: true });
            break;

          case NotificationChannel.SMS:
            await this.sendSMSNotification(notification);
            results.push({ channel, success: true });
            break;

          default:
            console.warn(`[AlertNotificationService] Unknown channel: ${channel}`);
        }
      } catch (error) {
        console.error(`[AlertNotificationService] Failed to send via ${channel}:`, error);
        results.push({ channel, success: false });
      }
    }

    // Update notification status
    const allFailed = results.every(r => !r.success);
    if (allFailed) {
      notification.status = 'failed';
      if (notification.retryCount && notification.retryCount < 3) {
        await this.retryNotification(notification);
      }
    } else {
      notification.status = 'sent';
    }

    console.log(`[AlertNotificationService] Notification ${notification.id} status: ${notification.status}`);
  }

  /**
   * Send email notification
   * @private
   */
  private async sendEmailNotification(notification: NotificationMessage): Promise<void> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log('[AlertNotificationService] Sending email notification:', {
      to: notification.alert.feedId, // Replace with actual email
      subject: notification.content.title,
      body: notification.content.body,
    });

    // Mock implementation
    return Promise.resolve();
  }

  /**
   * Send push notification
   * @private
   */
  private async sendPushNotification(notification: NotificationMessage): Promise<void> {
    // In production, integrate with push service (Firebase, OneSignal, etc.)
    console.log('[AlertNotificationService] Sending push notification:', {
      title: notification.content.title,
      body: notification.content.body,
      data: {
        alertId: notification.alert.id,
        propertyId: notification.alert.propertyId,
      },
    });

    // Mock implementation
    return Promise.resolve();
  }

  /**
   * Send webhook notification
   * @private
   */
  private async sendWebhookNotification(notification: NotificationMessage): Promise<void> {
    const payload: CasafariAlertWebhookPayload = {
      event: 'alert.created',
      timestamp: new Date().toISOString(),
      feed: {
        id: notification.feed.id,
        name: notification.feed.name,
      },
      alert: notification.alert,
    };

    // In production, make actual HTTP POST to webhook URL
    console.log('[AlertNotificationService] Sending webhook notification:', {
      url: notification.feed.webhookUrl,
      payload,
    });

    // Mock implementation
    return Promise.resolve();
  }

  /**
   * Send SMS notification
   * @private
   */
  private async sendSMSNotification(notification: NotificationMessage): Promise<void> {
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log('[AlertNotificationService] Sending SMS notification:', {
      message: `${notification.content.title}: ${notification.content.summary}`,
    });

    // Mock implementation
    return Promise.resolve();
  }

  /**
   * Check if notification should be sent based on preferences
   * @private
   */
  private shouldNotify(
    alert: CasafariAlert,
    preferences: NotificationPreferences
  ): boolean {
    // Check if subtype is in user preferences
    if (preferences.subtypes && preferences.subtypes.length > 0) {
      if (!preferences.subtypes.includes(alert.subtype)) {
        return false;
      }
    }

    // Check priority threshold
    const alertPriority = this.determinePriority(alert);
    if (preferences.minPriority) {
      const priorityOrder = [
        NotificationPriority.LOW,
        NotificationPriority.NORMAL,
        NotificationPriority.HIGH,
        NotificationPriority.URGENT,
      ];
      const alertPriorityIndex = priorityOrder.indexOf(alertPriority);
      const minPriorityIndex = priorityOrder.indexOf(preferences.minPriority);
      
      if (alertPriorityIndex < minPriorityIndex) {
        return false;
      }
    }

    return true;
  }

  /**
   * Determine notification priority based on alert
   * @private
   */
  private determinePriority(alert: CasafariAlert): NotificationPriority {
    // High priority for price reductions > 10%
    if (alert.subtype === 'price_reduction') {
      const reduction = alert.property.price.changePercentage || 0;
      if (Math.abs(reduction) > 10) {
        return NotificationPriority.HIGH;
      }
    }

    // High priority for new listings with high match score
    if (alert.subtype === 'new_listing' && alert.matchScore && alert.matchScore > 90) {
      return NotificationPriority.HIGH;
    }

    // Urgent for back on market
    if (alert.subtype === 'back_on_market') {
      return NotificationPriority.URGENT;
    }

    return NotificationPriority.NORMAL;
  }

  /**
   * Check if current time is in quiet hours
   * @private
   */
  private isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours) {
      return false;
    }

    // In production, implement proper timezone handling
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return (
      currentTime >= preferences.quietHours.start &&
      currentTime <= preferences.quietHours.end
    );
  }

  /**
   * Create notification message from alert
   * @private
   */
  private createNotification(
    alert: CasafariAlert,
    feed: CasafariAlertFeed,
    preferences: NotificationPreferences,
    priority: NotificationPriority
  ): NotificationMessage {
    const property = alert.property;
    
    // Format title based on alert type
    let title: string;
    switch (alert.subtype) {
      case 'new_listing':
        title = `Nova propriedade: ${property.title || property.propertyType}`;
        break;
      case 'price_reduction':
        title = `Redução de preço: ${property.title || property.propertyType}`;
        break;
      case 'price_increase':
        title = `Aumento de preço: ${property.title || property.propertyType}`;
        break;
      default:
        title = `Atualização: ${property.title || property.propertyType}`;
    }

    // Format body
    const priceStr = `€${property.price.current.toLocaleString('pt-PT')}`;
    const locationStr = `${property.location.municipality || property.location.district}`;
    const areaStr = property.characteristics.netArea
      ? ` - ${property.characteristics.netArea}m²`
      : '';
    
    let body = `${locationStr}${areaStr} - ${priceStr}`;
    
    if (property.price.change) {
      const changeStr = property.price.change > 0 ? '+' : '';
      body += ` (${changeStr}${property.price.changePercentage?.toFixed(1)}%)`;
    }

    return {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      alert,
      feed,
      priority,
      channels: preferences.channels,
      content: {
        title,
        body,
        summary: body,
        actionUrl: property.source?.url,
      },
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };
  }

  /**
   * Queue notification for later delivery
   * @private
   */
  private queueNotification(
    alert: CasafariAlert,
    feed: CasafariAlertFeed,
    preferences: NotificationPreferences,
    priority: NotificationPriority
  ): void {
    const notification = this.createNotification(alert, feed, preferences, priority);
    this.notificationQueue.push(notification);
  }

  /**
   * Add notification to batch
   * @private
   */
  private addToBatch(
    notification: NotificationMessage,
    preferences: NotificationPreferences
  ): void {
    const batchKey = `${preferences.userId}-${preferences.frequency}`;
    
    // Add to queue
    this.notificationQueue.push(notification);

    // Set up batch interval if not exists
    if (!this.batchIntervals.has(batchKey)) {
      const intervalMs = this.getIntervalMs(preferences.frequency);
      const interval = setInterval(() => {
        this.sendBatch(preferences.userId, preferences);
      }, intervalMs);
      
      this.batchIntervals.set(batchKey, interval);
    }
  }

  /**
   * Send batched notifications
   * @private
   */
  private async sendBatch(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    const userNotifications = this.notificationQueue.filter(
      n => n.alert.feedId.includes(userId) // Simplified userId matching
    );

    if (userNotifications.length === 0) {
      return;
    }

    const maxBatch = preferences.maxBatchSize || 10;
    const batch = userNotifications.slice(0, maxBatch);

    console.log(`[AlertNotificationService] Sending batch of ${batch.length} notifications`);

    for (const notification of batch) {
      await this.sendNotification(notification);
    }

    // Remove sent notifications from queue
    this.notificationQueue = this.notificationQueue.filter(
      n => !batch.includes(n)
    );
  }

  /**
   * Retry failed notification
   * @private
   */
  private async retryNotification(notification: NotificationMessage): Promise<void> {
    notification.retryCount = (notification.retryCount || 0) + 1;
    notification.status = 'retrying';

    // Exponential backoff
    const delayMs = Math.pow(2, notification.retryCount) * 1000;

    console.log(`[AlertNotificationService] Retrying notification ${notification.id} in ${delayMs}ms`);

    setTimeout(async () => {
      await this.sendNotification(notification);
    }, delayMs);
  }

  /**
   * Get interval in milliseconds for frequency
   * @private
   */
  private getIntervalMs(frequency: string): number {
    switch (frequency) {
      case 'hourly':
        return 60 * 60 * 1000;
      case 'daily':
        return 24 * 60 * 60 * 1000;
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000; // Default to hourly
    }
  }

  /**
   * Clean up service resources
   */
  dispose(): void {
    // Clear all batch intervals
    for (const interval of this.batchIntervals.values()) {
      clearInterval(interval);
    }
    this.batchIntervals.clear();
    this.notificationQueue = [];
  }
}
