/**
 * MatchAlertPanel - Painel de alertas de matches
 * Mostra score, razões do match, e ações rápidas
 */

'use client';

import React from 'react';
import { clsx } from 'clsx';
import { Bell, X, Check, Eye, Star, MessageSquare, Calendar } from 'lucide-react';
import { ScoreBadge } from '../ui/Badge';
import { Notification, NotificationPriority } from '@/services/notifications/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MatchAlertPanelProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
  onViewProperty?: (propertyId: string) => void;
  onCreateOpportunity?: (propertyId: string) => void;
  onScheduleVisit?: (propertyId: string) => void;
  className?: string;
}

export function MatchAlertPanel({
  notifications,
  onMarkAsRead,
  onDismiss,
  onViewProperty,
  onCreateOpportunity,
  onScheduleVisit,
  className,
}: MatchAlertPanelProps) {
  if (notifications.length === 0) {
    return (
      <div className={clsx('bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 text-center', className)}>
        <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">
          Sem notificações de matches no momento
        </p>
      </div>
    );
  }

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case NotificationPriority.HIGH:
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case NotificationPriority.MEDIUM:
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  const getPriorityIcon = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return '🚨';
      case NotificationPriority.HIGH:
        return '⚠️';
      case NotificationPriority.MEDIUM:
        return '📢';
      default:
        return '💡';
    }
  };

  return (
    <div className={clsx('space-y-3', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-emerald-600" />
          Alertas de Matches ({notifications.length})
        </h2>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={clsx(
              'border-l-4 rounded-lg p-4 shadow-sm transition-all',
              'bg-white dark:bg-slate-800',
              getPriorityColor(notification.priority),
              !notification.read && 'ring-2 ring-emerald-500/50'
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{getPriorityIcon(notification.priority)}</span>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {notification.title}
                  </h3>
                  {notification.matchScore && (
                    <ScoreBadge score={notification.matchScore.overall} size="sm" />
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {notification.message}
                </p>
              </div>
              <div className="flex gap-1 ml-2">
                {!notification.read && onMarkAsRead && (
                  <button
                    onClick={() => onMarkAsRead(notification.id)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    aria-label="Marcar como lida"
                    title="Marcar como lida"
                  >
                    <Check className="w-4 h-4 text-emerald-600" />
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(notification.id)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    aria-label="Dispensar"
                    title="Dispensar"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Match Details */}
            {notification.matchScore && (
              <div className="mb-3 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Localização</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {notification.matchScore.locationScore}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Preço</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {notification.matchScore.priceScore}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Características</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {notification.matchScore.featuresScore}%
                    </p>
                  </div>
                </div>

                {notification.matchScore.reasons.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Razões do match:
                    </p>
                    <ul className="space-y-0.5">
                      {notification.matchScore.reasons.map((reason, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start">
                          <span className="mr-1">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            {notification.propertyId && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => onViewProperty?.(notification.propertyId!)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  Ver Imóvel
                </button>
                {onCreateOpportunity && (
                  <button
                    onClick={() => onCreateOpportunity(notification.propertyId!)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                  >
                    <Star className="w-3 h-3" />
                    Criar Oportunidade
                  </button>
                )}
                {onScheduleVisit && (
                  <button
                    onClick={() => onScheduleVisit(notification.propertyId!)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-lg transition-colors"
                  >
                    <Calendar className="w-3 h-3" />
                    Agendar Visita
                  </button>
                )}
              </div>
            )}

            {/* Timestamp */}
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {formatDistanceToNow(notification.createdAt, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
