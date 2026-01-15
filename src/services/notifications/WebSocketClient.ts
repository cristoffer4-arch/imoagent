/**
 * WebSocketClient - Cliente WebSocket para Notificações em Tempo Real
 * Conecta ao servidor Socket.IO para receber notificações instantâneas
 */

import { io, Socket } from 'socket.io-client';
import { WebSocketMessage, Notification } from './types';

export class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(
    private url: string = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000',
    private path: string = '/api/socket'
  ) {}

  /**
   * Conecta ao servidor WebSocket
   */
  connect(userId: string): void {
    if (this.socket?.connected) {
      console.warn('WebSocket already connected');
      return;
    }

    this.socket = io(this.url, {
      path: this.path,
      transports: ['websocket', 'polling'],
      auth: {
        userId,
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventHandlers();
  }

  /**
   * Configura os handlers de eventos do Socket.IO
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.emit('internal:connected', { socketId: this.socket?.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.emit('internal:disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('internal:error', { error: 'Max reconnection attempts reached' });
      }
    });

    // Evento genérico para mensagens do servidor
    this.socket.onAny((event: string, data: any) => {
      const message: WebSocketMessage = {
        event,
        data,
        timestamp: Date.now(),
      };
      this.emit(event, message.data);
    });
  }

  /**
   * Inscreve-se em notificações de um usuário
   */
  subscribeToNotifications(userId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe-notifications', { userId });
  }

  /**
   * Cancela inscrição de notificações
   */
  unsubscribeFromNotifications(userId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot unsubscribe: WebSocket not connected');
      return;
    }

    this.socket.emit('unsubscribe-notifications', { userId });
  }

  /**
   * Marca notificação como lida
   */
  markAsRead(notificationId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot mark as read: WebSocket not connected');
      return;
    }

    this.socket.emit('notification-read', { notificationId });
  }

  /**
   * Registra listener para um evento
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  /**
   * Remove listener de um evento
   */
  off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Remove todos os listeners de um evento
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Emite evento para os listeners registrados
   */
  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in listener for event ${event}:`, error);
      }
    });
  }

  /**
   * Envia mensagem ao servidor
   */
  send(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send: WebSocket not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Desconecta do servidor
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obtém o ID do socket
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Singleton instance para uso global
let globalWebSocketClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!globalWebSocketClient) {
    globalWebSocketClient = new WebSocketClient();
  }
  return globalWebSocketClient;
}
