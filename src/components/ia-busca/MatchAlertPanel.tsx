/**
 * MatchAlertPanel - Alert panel showing match scores, reasons and quick actions
 * Real-time notification display with actionable insights
 */

'use client';

import React from 'react';
import { Bell, X, Star, TrendingUp, ExternalLink, Phone, Mail, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/services/notifications';
import type { PropertyMatch, Notification } from '@/services/notifications';

interface MatchAlertPanelProps {
  onViewProperty?: (propertyId: string) => void;
  onScheduleVisit?: (propertyId: string) => void;
  onContact?: (propertyId: string) => void;
  className?: string;
}

export function MatchAlertPanel({ 
  onViewProperty, 
  onScheduleVisit,
  onContact,
  className = '' 
}: MatchAlertPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications('property_match');

  const renderMatchNotification = (notification: Notification) => {
    if (notification.type !== 'property_match') return null;

    const match = notification.data as PropertyMatch;
    const { property, matchScore, matchReasons } = match;

    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-emerald-400 bg-emerald-500/10';
      if (score >= 60) return 'text-blue-400 bg-blue-500/10';
      if (score >= 40) return 'text-yellow-400 bg-yellow-500/10';
      return 'text-slate-400 bg-slate-500/10';
    };

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('pt-PT', { 
        style: 'currency', 
        currency: 'EUR',
        maximumFractionDigits: 0
      }).format(price);
    };

    const formatDate = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Agora mesmo';
      if (minutes < 60) return `Há ${minutes} min`;
      if (hours < 24) return `Há ${hours}h`;
      return `Há ${days} dias`;
    };

    return (
      <Card 
        key={notification.id}
        className={`transition-all duration-300 ${
          notification.read 
            ? 'bg-slate-900/50 border-slate-800' 
            : 'bg-gradient-to-br from-slate-900 to-slate-800 border-emerald-500/30'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Property Image Thumbnail */}
              {property.images && property.images[0] && (
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                  <img 
                    src={property.images[0]} 
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base line-clamp-2 text-slate-100">
                  {property.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`rounded-full px-2 py-0.5 text-xs font-bold ${getScoreColor(matchScore)}`}>
                    <Star className="w-3 h-3 inline mr-1" />
                    {matchScore}
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(notification.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAsRead(notification.id)}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Price */}
          <div className="text-xl font-bold text-emerald-400">
            {formatPrice(property.price)}
          </div>

          {/* Match Reasons */}
          {matchReasons && matchReasons.length > 0 && (
            <div className="space-y-1.5">
              {matchReasons.slice(0, 2).map((reason, index) => (
                <div 
                  key={index}
                  className="text-sm text-slate-300 flex items-start gap-2"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewProperty?.(property.id)}
              className="text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Ver Detalhes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onScheduleVisit?.(property.id)}
              className="text-xs"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Agendar Visita
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onContact?.(property.id)}
              className="text-xs"
            >
              <Phone className="w-3 h-3 mr-1" />
              Contactar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                // Email functionality
                window.location.href = `mailto:?subject=${encodeURIComponent(property.title)}&body=${encodeURIComponent(property.location)}`;
              }}
              className="text-xs"
            >
              <Mail className="w-3 h-3 mr-1" />
              Email
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={className}>
      <Card className="bg-slate-950 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              <CardTitle className="text-lg text-slate-100">
                Alertas de Match
              </CardTitle>
              {unreadCount > 0 && (
                <span className="bg-emerald-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </div>
            
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          {notifications.length === 0 && (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Nenhum alerta de momento</p>
              <p className="text-sm text-slate-500 mt-1">
                Será notificado quando houver novos matches
              </p>
            </div>
          )}

          {notifications.map(renderMatchNotification)}
        </CardContent>
      </Card>
    </div>
  );
}
