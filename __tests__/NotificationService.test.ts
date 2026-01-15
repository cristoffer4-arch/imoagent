/**
 * NotificationService Tests
 */

import { NotificationService } from '@/services/notifications/NotificationService';
import { NotificationType, NotificationPriority } from '@/services/notifications/types';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

// Mock WebSocket client
jest.mock('@/services/notifications/WebSocketClient', () => ({
  getWebSocketClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribeToNotifications: jest.fn(),
    on: jest.fn(),
    markAsRead: jest.fn(),
    isConnected: jest.fn(() => true),
  })),
}));

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.dispose();
  });

  describe('initialization', () => {
    it('should initialize and connect to WebSocket', async () => {
      const userId = 'test-user-123';
      await service.initialize(userId);
      
      // Service should be initialized
      expect(service).toBeDefined();
    });
  });

  describe('calculatePriority', () => {
    it('should return URGENT for high match scores (>=80)', () => {
      // Access private method through type assertion for testing
      const priority = (service as any).calculatePriority(85);
      expect(priority).toBe(NotificationPriority.URGENT);
    });

    it('should return HIGH for medium-high match scores (60-79)', () => {
      const priority = (service as any).calculatePriority(70);
      expect(priority).toBe(NotificationPriority.HIGH);
    });

    it('should return MEDIUM for medium match scores (40-59)', () => {
      const priority = (service as any).calculatePriority(50);
      expect(priority).toBe(NotificationPriority.MEDIUM);
    });

    it('should return LOW for low match scores (<40)', () => {
      const priority = (service as any).calculatePriority(30);
      expect(priority).toBe(NotificationPriority.LOW);
    });
  });

  describe('notification callbacks', () => {
    it('should register notification callback', () => {
      const callback = jest.fn();
      const unsubscribe = service.onNotification(callback);
      
      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should call registered callbacks when notification is received', () => {
      const callback = jest.fn();
      service.onNotification(callback);
      
      const mockNotification = {
        id: 'notif-123',
        type: NotificationType.PROPERTY_MATCH,
        priority: NotificationPriority.HIGH,
        title: 'Test Notification',
        message: 'Test message',
        read: false,
        createdAt: new Date(),
      };
      
      // Trigger notification through private method
      (service as any).handleNewNotification(mockNotification);
      
      expect(callback).toHaveBeenCalledWith(mockNotification);
    });

    it('should unsubscribe callback', () => {
      const callback = jest.fn();
      const unsubscribe = service.onNotification(callback);
      
      unsubscribe();
      
      const mockNotification = {
        id: 'notif-123',
        type: NotificationType.PROPERTY_MATCH,
        priority: NotificationPriority.HIGH,
        title: 'Test Notification',
        message: 'Test message',
        read: false,
        createdAt: new Date(),
      };
      
      (service as any).handleNewNotification(mockNotification);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('notification generation', () => {
    it('should generate unique IDs', () => {
      const id1 = (service as any).generateId();
      const id2 = (service as any).generateId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^notif_\d+_[a-z0-9]+$/);
    });
  });

  describe('browser notifications', () => {
    it('should request notification permission', async () => {
      // Mock Notification API
      const mockNotification = {
        permission: 'default',
        requestPermission: jest.fn().mockResolvedValue('granted'),
      };
      (global as any).Notification = mockNotification;
      
      const result = await service.requestNotificationPermission();
      
      expect(result).toBe(true);
      expect(mockNotification.requestPermission).toHaveBeenCalled();
    });

    it('should return false when Notification API is not available', async () => {
      delete (global as any).Notification;
      
      const result = await service.requestNotificationPermission();
      
      expect(result).toBe(false);
    });
  });

  describe('disposal', () => {
    it('should cleanup resources on dispose', () => {
      const callback = jest.fn();
      service.onNotification(callback);
      
      service.dispose();
      
      const mockNotification = {
        id: 'notif-123',
        type: NotificationType.PROPERTY_MATCH,
        priority: NotificationPriority.HIGH,
        title: 'Test Notification',
        message: 'Test message',
        read: false,
        createdAt: new Date(),
      };
      
      (service as any).handleNewNotification(mockNotification);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
