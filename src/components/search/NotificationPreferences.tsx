/**
 * NotificationPreferences - Configurações de preferências de notificações
 */

'use client';

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Bell, Mail, Smartphone, Clock, Save, Loader2 } from 'lucide-react';
import { NotificationPreferences as NotificationPreferencesType } from '@/services/notifications/types';

interface NotificationPreferencesProps {
  userId: string;
  onSave?: (preferences: NotificationPreferencesType) => Promise<void>;
  className?: string;
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferencesType, 'userId'> = {
  enablePropertyMatches: true,
  enableNewProperties: true,
  enablePriceChanges: true,
  enableMarketEvents: true,
  minMatchScore: 60,
  notificationChannels: {
    inApp: true,
    email: true,
    push: false,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

export function NotificationPreferences({
  userId,
  onSave,
  className,
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferencesType>({
    userId,
    ...DEFAULT_PREFERENCES,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (path: string, value: any) => {
    setPreferences(prev => {
      const keys = path.split('.');
      const newPrefs = { ...prev };
      let current: any = newPrefs;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newPrefs;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave(preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={clsx('bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700', className)}>
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-emerald-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Preferências de Notificações
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Configure como e quando deseja receber notificações
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Notification Types */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Tipos de Notificações
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Property Matches</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Notificações quando imóveis correspondem aos seus critérios
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.enablePropertyMatches}
                onChange={(e) => handleChange('enablePropertyMatches', e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🆕</div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Novas Propriedades</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Alertas quando novos imóveis são adicionados
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.enableNewProperties}
                onChange={(e) => handleChange('enableNewProperties', e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-2xl">💰</div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Mudanças de Preço</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Notificações de alterações de preço (subidas e descidas)
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.enablePriceChanges}
                onChange={(e) => handleChange('enablePriceChanges', e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📊</div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Eventos de Mercado</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Alertas de eventos importantes do mercado imobiliário
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.enableMarketEvents}
                onChange={(e) => handleChange('enableMarketEvents', e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>
          </div>
        </div>

        {/* Match Score Threshold */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Score Mínimo de Match
          </h3>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Apenas notificar para matches acima de:
              </span>
              <span className="text-2xl font-bold text-emerald-600">
                {preferences.minMatchScore}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={preferences.minMatchScore}
              onChange={(e) => handleChange('minMatchScore', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500 mt-2">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Notification Channels */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Canais de Notificação
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">In-App</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Notificações dentro da aplicação
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.notificationChannels.inApp}
                onChange={(e) => handleChange('notificationChannels.inApp', e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Email</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Enviar notificações por email
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.notificationChannels.email}
                onChange={(e) => handleChange('notificationChannels.email', e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Push</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Notificações push no browser
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.notificationChannels.push}
                onChange={(e) => handleChange('notificationChannels.push', e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Horário Silencioso
          </h3>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">
                  Ativar Horário Silencioso
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.quietHours?.enabled || false}
                onChange={(e) => handleChange('quietHours.enabled', e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            {preferences.quietHours?.enabled && (
              <div className="grid grid-cols-2 gap-4 pl-8">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Início
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) => handleChange('quietHours.start', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Fim
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) => handleChange('quietHours.end', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className={clsx(
              'w-full px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
              saved
                ? 'bg-green-600 text-white'
                : 'bg-emerald-600 text-white hover:bg-emerald-700',
              saving && 'opacity-50 cursor-not-allowed'
            )}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                A guardar...
              </>
            ) : saved ? (
              <>
                <Save className="w-5 h-5" />
                Guardado com sucesso!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Preferências
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
