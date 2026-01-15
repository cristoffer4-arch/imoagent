/**
 * IA Busca Page - Módulo de Busca Inteligente de Imóveis
 * Integra notificações em tempo real, dashboard de leads, e busca avançada
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Search, Users, Settings } from 'lucide-react';
import {
  PropertyMatchCard,
  PropertyMatch,
  MatchAlertPanel,
  SearchResultsGrid,
  LeadDashboard,
  Lead,
  NotificationPreferences,
} from '@/components/search';
import { getNotificationService, Notification, NotificationType } from '@/services/notifications';
import { FilterValue } from '@/components/ui/FilterPanel';

type TabType = 'search' | 'alerts' | 'leads' | 'settings';

export default function IABuscaPage() {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string>('user_demo'); // TODO: Get from auth context

  useEffect(() => {
    // Initialize notification service
    const notificationService = getNotificationService();
    notificationService.initialize(userId);

    // Request browser notification permission
    notificationService.requestNotificationPermission();

    // Subscribe to new notifications
    const unsubscribe = notificationService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Load existing notifications
    loadNotifications();

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const loadNotifications = async () => {
    const notificationService = getNotificationService();
    const allNotifications = await notificationService.getNotifications({
      types: [NotificationType.PROPERTY_MATCH, NotificationType.NEW_PROPERTY, NotificationType.PRICE_DROP],
      unreadOnly: false,
    });
    setNotifications(allNotifications);
    setUnreadCount(allNotifications.filter(n => !n.read).length);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const notificationService = getNotificationService();
    await notificationService.markAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleDismiss = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Mock search function - replace with actual API call
  const handleSearch = async (filters: FilterValue, page: number): Promise<{ properties: PropertyMatch[]; total: number }> => {
    // TODO: Call properties-search.ts Netlify function
    console.log('Searching with filters:', filters, 'page:', page);
    
    // Mock data for demonstration
    return {
      properties: [],
      total: 0,
    };
  };

  const handleViewProperty = (propertyId: string) => {
    console.log('View property:', propertyId);
    // TODO: Navigate to property detail page
  };

  const handleFavoriteProperty = (propertyId: string) => {
    console.log('Favorite property:', propertyId);
    // TODO: Add to favorites
  };

  const handleShareProperty = (propertyId: string) => {
    console.log('Share property:', propertyId);
    // TODO: Open share dialog
  };

  const handleCreateOpportunity = (propertyId: string) => {
    console.log('Create opportunity for property:', propertyId);
    // TODO: Create opportunity
  };

  const handleScheduleVisit = (propertyId: string) => {
    console.log('Schedule visit for property:', propertyId);
    // TODO: Open schedule dialog
  };

  const handleViewLead = (leadId: string) => {
    console.log('View lead:', leadId);
    // TODO: Navigate to lead detail
  };

  const handleSavePreferences = async (preferences: any) => {
    console.log('Save preferences:', preferences);
    // TODO: Save to database
  };

  // Mock leads data
  const mockLeads: Lead[] = [];

  const tabs = [
    { id: 'search' as TabType, label: 'Busca', icon: Search },
    { id: 'alerts' as TabType, label: 'Alertas', icon: Bell, badge: unreadCount },
    { id: 'leads' as TabType, label: 'Leads', icon: Users },
    { id: 'settings' as TabType, label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            🔍 Busca Inteligente de Imóveis
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Centralize pesquisas em 7+ portais imobiliários com notificações em tempo real
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-medium transition-colors relative
                    ${activeTab === tab.id
                      ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'search' && (
            <SearchResultsGrid
              onSearch={handleSearch}
              onViewProperty={handleViewProperty}
              onFavoriteProperty={handleFavoriteProperty}
              onShareProperty={handleShareProperty}
            />
          )}

          {activeTab === 'alerts' && (
            <MatchAlertPanel
              notifications={notifications.filter(n => 
                n.type === NotificationType.PROPERTY_MATCH ||
                n.type === NotificationType.NEW_PROPERTY ||
                n.type === NotificationType.PRICE_DROP
              )}
              onMarkAsRead={handleMarkAsRead}
              onDismiss={handleDismiss}
              onViewProperty={handleViewProperty}
              onCreateOpportunity={handleCreateOpportunity}
              onScheduleVisit={handleScheduleVisit}
            />
          )}

          {activeTab === 'leads' && (
            <LeadDashboard
              leads={mockLeads}
              onViewLead={handleViewLead}
            />
          )}

          {activeTab === 'settings' && (
            <NotificationPreferences
              userId={userId}
              onSave={handleSavePreferences}
            />
          )}
        </div>
      </div>
    </div>
  );
}
