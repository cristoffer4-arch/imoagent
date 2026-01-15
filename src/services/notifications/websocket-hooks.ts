/**
 * WebSocket hook for real-time notifications
 * Connects to Socket.IO server for live property updates
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import socketIOClient, { Socket } from 'socket.io-client';
import { notificationService } from '@/services/notifications';
import type { PropertyMatch, PriceChange } from '@/services/notifications';

interface UseWebSocketNotificationsOptions {
  userId: string;
  enabled?: boolean;
}

export function useWebSocketNotifications({ userId, enabled = true }: UseWebSocketNotificationsOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId) return;

    const socketUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    try {
      // Initialize Socket.IO connection
      const socket = socketIOClient(socketUrl, {
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('📡 WebSocket connected');
        setConnected(true);
        setError(null);
        
        // Subscribe to user-specific notifications
        socket.emit('subscribe-notifications', { userId });
      });

      socket.on('disconnect', (reason) => {
        console.log('📡 WebSocket disconnected:', reason);
        setConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('📡 WebSocket connection error:', err);
        setError(err.message);
        setConnected(false);
      });

      // Property match notification
      socket.on('property-match', (match: PropertyMatch) => {
        console.log('🏠 Received property match:', match);
        notificationService.notifyPropertyMatch(match, 'high');
      });

      // Price change notification
      socket.on('price-change', (data: { change: PriceChange; propertyTitle: string }) => {
        console.log('💰 Received price change:', data);
        notificationService.notifyPriceChange(data.change, data.propertyTitle, 'high');
      });

      // New property notification
      socket.on('new-property', (property: PropertyMatch['property']) => {
        console.log('🆕 Received new property:', property);
        notificationService.notifyNewProperty(property, 'medium');
      });

      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.emit('unsubscribe-notifications', { userId });
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } catch (err) {
      console.error('Error initializing WebSocket:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [userId, enabled]);

  return {
    connected,
    error,
    socket: socketRef.current,
  };
}

/**
 * Hook for sending test notifications (development/testing)
 */
export function useTestNotifications() {
  const [sending, setSending] = useState(false);

  const sendTestPropertyMatch = async (userId: string) => {
    setSending(true);
    try {
      const mockMatch: PropertyMatch = {
        propertyId: `test-${Date.now()}`,
        matchScore: Math.floor(Math.random() * 40) + 60, // 60-100
        matchReasons: [
          'Preço dentro do orçamento definido',
          'Localização premium',
          'Imóvel recém-publicado'
        ],
        property: {
          id: `test-${Date.now()}`,
          title: 'Apartamento T2 em Lisboa (Teste)',
          price: 350000,
          area: 85,
          bedrooms: 2,
          bathrooms: 1,
          location: 'Avenidas Novas, Lisboa',
          images: [],
          angariaScore: 75,
          vendaScore: 80
        }
      };

      notificationService.notifyPropertyMatch(mockMatch, 'high');
    } finally {
      setSending(false);
    }
  };

  const sendTestPriceChange = async (userId: string) => {
    setSending(true);
    try {
      const mockChange: PriceChange = {
        propertyId: `test-${Date.now()}`,
        oldPrice: 400000,
        newPrice: 360000,
        percentageChange: -10,
        priceDirection: 'down'
      };

      notificationService.notifyPriceChange(mockChange, 'Apartamento T3 no Porto (Teste)', 'high');
    } finally {
      setSending(false);
    }
  };

  return {
    sending,
    sendTestPropertyMatch,
    sendTestPriceChange,
  };
}
