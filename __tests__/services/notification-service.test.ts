/**
 * Tests for NotificationService
 */

import { notificationService } from '@/services/notifications/notification-service';
import type { PropertyMatch, PriceChange } from '@/services/notifications';

describe('NotificationService', () => {
  beforeEach(() => {
    // Clear notifications before each test
    notificationService.clearAll();
  });

  describe('Property Match Notifications', () => {
    it('should create a property match notification', () => {
      const mockMatch: PropertyMatch = {
        propertyId: 'test-1',
        matchScore: 85,
        matchReasons: ['Good location', 'Price within budget'],
        property: {
          id: 'test-1',
          title: 'Test Property',
          price: 300000,
          area: 100,
          bedrooms: 2,
          bathrooms: 1,
          location: 'Lisboa',
          images: [],
        }
      };

      notificationService.notifyPropertyMatch(mockMatch);
      
      const notifications = notificationService.getNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('property_match');
      expect(notifications[0].read).toBe(false);
    });

    it('should emit notification to subscribers', (done) => {
      const mockMatch: PropertyMatch = {
        propertyId: 'test-2',
        matchScore: 90,
        matchReasons: ['High score'],
        property: {
          id: 'test-2',
          title: 'Test Property 2',
          price: 400000,
          area: 120,
          bedrooms: 3,
          bathrooms: 2,
          location: 'Porto',
          images: [],
        }
      };

      const unsubscribe = notificationService.subscribe('property_match', (notification) => {
        expect(notification.type).toBe('property_match');
        expect(notification.data).toEqual(mockMatch);
        unsubscribe();
        done();
      });

      notificationService.notifyPropertyMatch(mockMatch);
    });
  });

  describe('Price Change Notifications', () => {
    it('should create a price change notification', () => {
      const mockChange: PriceChange = {
        propertyId: 'test-3',
        oldPrice: 500000,
        newPrice: 450000,
        percentageChange: -10,
        priceDirection: 'down'
      };

      notificationService.notifyPriceChange(mockChange, 'Test Property 3');
      
      const notifications = notificationService.getNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('price_change');
      expect(notifications[0].priority).toBe('high');
    });

    it('should format price correctly in message', () => {
      const mockChange: PriceChange = {
        propertyId: 'test-4',
        oldPrice: 300000,
        newPrice: 330000,
        percentageChange: 10,
        priceDirection: 'up'
      };

      notificationService.notifyPriceChange(mockChange, 'Test Property 4');
      
      const notifications = notificationService.getNotifications();
      expect(notifications[0].message).toContain('€');
      expect(notifications[0].message).toContain('10.0%');
    });
  });

  describe('Notification Management', () => {
    it('should mark notification as read', () => {
      const mockMatch: PropertyMatch = {
        propertyId: 'test-5',
        matchScore: 70,
        matchReasons: ['Test'],
        property: {
          id: 'test-5',
          title: 'Test Property 5',
          price: 250000,
          area: 80,
          bedrooms: 2,
          bathrooms: 1,
          location: 'Cascais',
          images: [],
        }
      };

      notificationService.notifyPropertyMatch(mockMatch);
      
      const notifications = notificationService.getNotifications();
      const notificationId = notifications[0].id;
      
      notificationService.markAsRead(notificationId);
      
      const updatedNotifications = notificationService.getNotifications();
      expect(updatedNotifications[0].read).toBe(true);
    });

    it('should mark all notifications as read', () => {
      // Create multiple notifications
      for (let i = 0; i < 3; i++) {
        const mockMatch: PropertyMatch = {
          propertyId: `test-${i}`,
          matchScore: 75,
          matchReasons: ['Test'],
          property: {
            id: `test-${i}`,
            title: `Test Property ${i}`,
            price: 300000,
            area: 100,
            bedrooms: 2,
            bathrooms: 1,
            location: 'Lisboa',
            images: [],
          }
        };
        notificationService.notifyPropertyMatch(mockMatch);
      }

      notificationService.markAllAsRead();
      
      const notifications = notificationService.getNotifications();
      expect(notifications.every(n => n.read)).toBe(true);
    });

    it('should get only unread notifications', () => {
      // Create notifications
      for (let i = 0; i < 3; i++) {
        const mockMatch: PropertyMatch = {
          propertyId: `test-${i}`,
          matchScore: 75,
          matchReasons: ['Test'],
          property: {
            id: `test-${i}`,
            title: `Test Property ${i}`,
            price: 300000,
            area: 100,
            bedrooms: 2,
            bathrooms: 1,
            location: 'Lisboa',
            images: [],
          }
        };
        notificationService.notifyPropertyMatch(mockMatch);
      }

      // Mark one as read
      const notifications = notificationService.getNotifications();
      notificationService.markAsRead(notifications[0].id);

      const unreadNotifications = notificationService.getUnreadNotifications();
      expect(unreadNotifications).toHaveLength(2);
    });

    it('should clear all notifications', () => {
      const mockMatch: PropertyMatch = {
        propertyId: 'test-6',
        matchScore: 80,
        matchReasons: ['Test'],
        property: {
          id: 'test-6',
          title: 'Test Property 6',
          price: 350000,
          area: 110,
          bedrooms: 3,
          bathrooms: 2,
          location: 'Porto',
          images: [],
        }
      };

      notificationService.notifyPropertyMatch(mockMatch);
      expect(notificationService.getNotifications()).toHaveLength(1);

      notificationService.clearAll();
      expect(notificationService.getNotifications()).toHaveLength(0);
    });

    it('should limit notification history to 100 items', () => {
      // Create more than 100 notifications
      for (let i = 0; i < 110; i++) {
        const mockMatch: PropertyMatch = {
          propertyId: `test-${i}`,
          matchScore: 75,
          matchReasons: ['Test'],
          property: {
            id: `test-${i}`,
            title: `Test Property ${i}`,
            price: 300000,
            area: 100,
            bedrooms: 2,
            bathrooms: 1,
            location: 'Lisboa',
            images: [],
          }
        };
        notificationService.notifyPropertyMatch(mockMatch);
      }

      const notifications = notificationService.getNotifications();
      expect(notifications.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Subscription System', () => {
    it('should subscribe to all notification types', (done) => {
      const unsubscribe = notificationService.subscribe('all', (notification) => {
        expect(notification).toBeDefined();
        unsubscribe();
        done();
      });

      const mockMatch: PropertyMatch = {
        propertyId: 'test-7',
        matchScore: 85,
        matchReasons: ['Test'],
        property: {
          id: 'test-7',
          title: 'Test Property 7',
          price: 300000,
          area: 100,
          bedrooms: 2,
          bathrooms: 1,
          location: 'Lisboa',
          images: [],
        }
      };

      notificationService.notifyPropertyMatch(mockMatch);
    });

    it('should unsubscribe properly', () => {
      let callCount = 0;
      
      const unsubscribe = notificationService.subscribe('property_match', () => {
        callCount++;
      });

      const mockMatch: PropertyMatch = {
        propertyId: 'test-8',
        matchScore: 85,
        matchReasons: ['Test'],
        property: {
          id: 'test-8',
          title: 'Test Property 8',
          price: 300000,
          area: 100,
          bedrooms: 2,
          bathrooms: 1,
          location: 'Lisboa',
          images: [],
        }
      };

      notificationService.notifyPropertyMatch(mockMatch);
      expect(callCount).toBe(1);

      unsubscribe();

      notificationService.notifyPropertyMatch(mockMatch);
      expect(callCount).toBe(1); // Should not increment
    });
  });
});
