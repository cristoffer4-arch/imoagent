/**
 * NotificationService - Serviço de Gerenciamento de Notificações
 * Gerencia notificações de matches, novas propriedades, mudanças de preço
 * Integra com WebSocket para notificações em tempo real
 */

import { createClient } from '@/lib/supabase/client';
import { getWebSocketClient, WebSocketClient } from './WebSocketClient';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationPreferences,
  NotificationFilter,
  NotificationStats,
  MatchScore,
} from './types';

export class NotificationService {
  private wsClient: WebSocketClient;
  private supabase = createClient();
  private notificationCallbacks: Set<(notification: Notification) => void> = new Set();

  constructor() {
    this.wsClient = getWebSocketClient();
    this.setupWebSocketListeners();
  }

  /**
   * Configura listeners do WebSocket
   */
  private setupWebSocketListeners(): void {
    // Listener para novas notificações
    this.wsClient.on('notification', (data: Notification) => {
      this.handleNewNotification(data);
    });

    // Listener para propriedades que fazem match
    this.wsClient.on('property-match', (data: any) => {
      this.createPropertyMatchNotification(data);
    });

    // Listener para mudanças de preço
    this.wsClient.on('price-change', (data: any) => {
      this.createPriceChangeNotification(data);
    });

    // Listener para novas propriedades
    this.wsClient.on('new-property', (data: any) => {
      this.createNewPropertyNotification(data);
    });
  }

  /**
   * Inicializa o serviço e conecta ao WebSocket
   */
  async initialize(userId: string): Promise<void> {
    // Conecta ao WebSocket
    if (!this.wsClient.isConnected()) {
      this.wsClient.connect(userId);
      this.wsClient.subscribeToNotifications(userId);
    }

    // Carrega preferências do usuário
    await this.loadUserPreferences(userId);
  }

  /**
   * Carrega preferências de notificação do usuário
   */
  private async loadUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error loading notification preferences:', error);
        return null;
      }

      return data as NotificationPreferences;
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      return null;
    }
  }

  /**
   * Manipula nova notificação recebida
   */
  private handleNewNotification(notification: Notification): void {
    // Notifica todos os callbacks registrados
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });

    // Exibe notificação no browser (se suportado)
    this.showBrowserNotification(notification);
  }

  /**
   * Cria notificação para property match
   */
  private async createPropertyMatchNotification(data: any): Promise<void> {
    const notification: Notification = {
      id: this.generateId(),
      type: NotificationType.PROPERTY_MATCH,
      priority: this.calculatePriority(data.matchScore?.overall || 0),
      title: '🎯 Novo Imóvel Match!',
      message: `Encontrámos um imóvel que corresponde aos seus critérios (${data.matchScore?.overall}% match)`,
      propertyId: data.propertyId,
      matchScore: data.matchScore,
      metadata: data,
      read: false,
      createdAt: new Date(),
    };

    await this.saveNotification(notification);
    this.handleNewNotification(notification);
  }

  /**
   * Cria notificação para mudança de preço
   */
  private async createPriceChangeNotification(data: any): Promise<void> {
    const isPriceDrop = data.oldPrice > data.newPrice;
    const priceChange = Math.abs(data.newPrice - data.oldPrice);
    const percentChange = ((priceChange / data.oldPrice) * 100).toFixed(1);

    const notification: Notification = {
      id: this.generateId(),
      type: isPriceDrop ? NotificationType.PRICE_DROP : NotificationType.PRICE_INCREASE,
      priority: isPriceDrop ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      title: isPriceDrop ? '📉 Descida de Preço!' : '📈 Aumento de Preço',
      message: `O imóvel ${data.propertyTitle} teve uma ${isPriceDrop ? 'descida' : 'subida'} de ${percentChange}%`,
      propertyId: data.propertyId,
      metadata: data,
      read: false,
      createdAt: new Date(),
    };

    await this.saveNotification(notification);
    this.handleNewNotification(notification);
  }

  /**
   * Cria notificação para nova propriedade
   */
  private async createNewPropertyNotification(data: any): Promise<void> {
    const notification: Notification = {
      id: this.generateId(),
      type: NotificationType.NEW_PROPERTY,
      priority: NotificationPriority.MEDIUM,
      title: '🆕 Nova Propriedade',
      message: `Nova propriedade disponível: ${data.propertyTitle}`,
      propertyId: data.propertyId,
      metadata: data,
      read: false,
      createdAt: new Date(),
    };

    await this.saveNotification(notification);
    this.handleNewNotification(notification);
  }

  /**
   * Calcula prioridade baseada no match score
   */
  private calculatePriority(matchScore: number): NotificationPriority {
    if (matchScore >= 80) return NotificationPriority.URGENT;
    if (matchScore >= 60) return NotificationPriority.HIGH;
    if (matchScore >= 40) return NotificationPriority.MEDIUM;
    return NotificationPriority.LOW;
  }

  /**
   * Salva notificação no banco de dados
   */
  private async saveNotification(notification: Notification): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .insert({
          id: notification.id,
          type: notification.type,
          priority: notification.priority,
          title: notification.title,
          message: notification.message,
          property_id: notification.propertyId,
          match_score: notification.matchScore,
          metadata: notification.metadata,
          read: notification.read,
          created_at: notification.createdAt.toISOString(),
          expires_at: notification.expiresAt?.toISOString(),
        });

      if (error) {
        console.error('Error saving notification:', error);
      }
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }

  /**
   * Exibe notificação no browser
   */
  private showBrowserNotification(notification: Notification): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  }

  /**
   * Registra callback para novas notificações
   */
  onNotification(callback: (notification: Notification) => void): () => void {
    this.notificationCallbacks.add(callback);
    
    // Retorna função para remover o callback
    return () => {
      this.notificationCallbacks.delete(callback);
    };
  }

  /**
   * Busca notificações com filtros
   */
  async getNotifications(filter?: NotificationFilter): Promise<Notification[]> {
    try {
      let query = this.supabase.from('notifications').select('*');

      if (filter?.types) {
        query = query.in('type', filter.types);
      }

      if (filter?.priorities) {
        query = query.in('priority', filter.priorities);
      }

      if (filter?.unreadOnly) {
        query = query.eq('read', false);
      }

      if (filter?.propertyId) {
        query = query.eq('property_id', filter.propertyId);
      }

      if (filter?.fromDate) {
        query = query.gte('created_at', filter.fromDate.toISOString());
      }

      if (filter?.toDate) {
        query = query.lte('created_at', filter.toDate.toISOString());
      }

      query = query.order('created_at', { ascending: false }).limit(50);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return (data || []).map(this.mapFromDatabase);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      }

      // Notifica o WebSocket
      this.wsClient.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Marca todas as notificações como lidas
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Obtém estatísticas de notificações
   */
  async getStats(userId: string): Promise<NotificationStats> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('type, priority, read')
        .eq('user_id', userId);

      if (error || !data) {
        return this.getEmptyStats();
      }

      const stats: NotificationStats = {
        total: data.length,
        unread: data.filter(n => !n.read).length,
        byType: {} as Record<NotificationType, number>,
        byPriority: {} as Record<NotificationPriority, number>,
      };

      // Contabiliza por tipo
      Object.values(NotificationType).forEach(type => {
        stats.byType[type] = data.filter(n => n.type === type).length;
      });

      // Contabiliza por prioridade
      Object.values(NotificationPriority).forEach(priority => {
        stats.byPriority[priority] = data.filter(n => n.priority === priority).length;
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Retorna estatísticas vazias
   */
  private getEmptyStats(): NotificationStats {
    return {
      total: 0,
      unread: 0,
      byType: Object.values(NotificationType).reduce((acc, type) => ({ ...acc, [type]: 0 }), {} as Record<NotificationType, number>),
      byPriority: Object.values(NotificationPriority).reduce((acc, priority) => ({ ...acc, [priority]: 0 }), {} as Record<NotificationPriority, number>),
    };
  }

  /**
   * Mapeia dados do banco para modelo de notificação
   */
  private mapFromDatabase(data: any): Notification {
    return {
      id: data.id,
      type: data.type,
      priority: data.priority,
      title: data.title,
      message: data.message,
      propertyId: data.property_id,
      matchScore: data.match_score,
      metadata: data.metadata,
      read: data.read,
      createdAt: new Date(data.created_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    };
  }

  /**
   * Solicita permissão para notificações do browser
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Gera ID único para notificação
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Limpa recursos e desconecta
   */
  dispose(): void {
    this.notificationCallbacks.clear();
    this.wsClient.disconnect();
  }
}

// Singleton instance
let globalNotificationService: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!globalNotificationService) {
    globalNotificationService = new NotificationService();
  }
  return globalNotificationService;
}
