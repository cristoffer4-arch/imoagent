/**
 * React hooks for notification system
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { notificationService } from './notification-service';
import type { Notification, NotificationType, NotificationPreferences } from './notification-types';

/**
 * Hook to subscribe to notifications
 */
export function useNotifications(type: NotificationType | 'all' = 'all') {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initial load
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadNotifications().length);

    // Subscribe to new notifications
    const unsubscribe = notificationService.subscribe(type, (notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, [type]);

  const markAsRead = useCallback((notificationId: string) => {
    notificationService.markAsRead(notificationId);
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadNotifications().length);
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getNotifications());
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    notificationService.clearAll();
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}

/**
 * Hook to manage notification preferences
 */
export function useNotificationPreferences(userId: string) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        const prefs = await notificationService.getPreferences(userId);
        setPreferences(prefs);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!userId) return false;

    setLoading(true);
    try {
      const success = await notificationService.updatePreferences(userId, updates);
      if (success) {
        setPreferences(prev => prev ? { ...prev, ...updates } : null);
        setError(null);
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
  };
}

/**
 * Hook to request browser notification permission
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setRequesting(true);
    try {
      const result = await notificationService.requestPermission();
      setPermission(result);
      return result;
    } finally {
      setRequesting(false);
    }
  }, []);

  return {
    permission,
    requesting,
    requestPermission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
  };
}
