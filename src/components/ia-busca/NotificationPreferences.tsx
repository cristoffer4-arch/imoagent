/**
 * NotificationPreferences - User preferences for notifications
 * Configurable filters and notification settings
 */

'use client';

import React, { useState } from 'react';
import { Bell, Volume2, VolumeX, Monitor, MapPin, DollarSign, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotificationPreferences, useNotificationPermission } from '@/services/notifications';

interface NotificationPreferencesProps {
  userId: string;
}

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const { preferences, loading, updatePreferences } = useNotificationPreferences(userId);
  const { permission, requesting, requestPermission, isGranted } = useNotificationPermission();
  
  const [localPrefs, setLocalPrefs] = useState(preferences || {
    userId,
    enableNotifications: true,
    enableSound: true,
    enableDesktop: false,
    notificationTypes: {
      propertyMatch: true,
      priceChange: true,
      newProperty: true,
      availabilityChange: true,
    },
    filters: {
      minMatchScore: 60,
      minPriceChange: 5,
      locations: [],
      priceRange: {
        min: 0,
        max: 1000000,
      },
    },
  });

  const [locationInput, setLocationInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    
    const success = await updatePreferences(localPrefs);
    
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    
    setSaving(false);
  };

  const addLocation = () => {
    if (locationInput.trim() && !localPrefs.filters.locations.includes(locationInput.trim())) {
      setLocalPrefs(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          locations: [...prev.filters.locations, locationInput.trim()]
        }
      }));
      setLocationInput('');
    }
  };

  const removeLocation = (location: string) => {
    setLocalPrefs(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        locations: prev.filters.locations.filter(l => l !== location)
      }
    }));
  };

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      setLocalPrefs(prev => ({ ...prev, enableDesktop: true }));
    }
  };

  if (loading && !preferences) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-slate-400">A carregar preferências...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Browser Notifications */}
      {!isGranted && (
        <Card className="bg-gradient-to-br from-emerald-900/20 to-blue-900/20 border-emerald-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Bell className="w-5 h-5 text-emerald-400" />
              Ativar Notificações do Navegador
            </CardTitle>
            <CardDescription className="text-slate-300">
              Receba alertas em tempo real mesmo quando não estiver na aplicação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="primary"
              onClick={handleRequestPermission}
              disabled={requesting || permission === 'denied'}
            >
              <Monitor className="w-4 h-4 mr-2" />
              {requesting ? 'A solicitar...' : 'Ativar Notificações'}
            </Button>
            {permission === 'denied' && (
              <p className="text-sm text-orange-400 mt-2">
                Notificações bloqueadas. Ative nas configurações do navegador.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* General Settings */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Configurações Gerais</CardTitle>
          <CardDescription className="text-slate-400">
            Controle como e quando receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-200">Notificações Ativas</p>
                <p className="text-sm text-slate-500">Receber todas as notificações</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.enableNotifications}
                onChange={(e) => setLocalPrefs(prev => ({ ...prev, enableNotifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Enable Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {localPrefs.enableSound ? (
                <Volume2 className="w-5 h-5 text-slate-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <p className="font-medium text-slate-200">Som das Notificações</p>
                <p className="text-sm text-slate-500">Reproduzir som ao receber alertas</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.enableSound}
                onChange={(e) => setLocalPrefs(prev => ({ ...prev, enableSound: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Desktop Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-200">Notificações Desktop</p>
                <p className="text-sm text-slate-500">Mostrar notificações do sistema</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.enableDesktop}
                onChange={(e) => setLocalPrefs(prev => ({ ...prev, enableDesktop: e.target.checked }))}
                disabled={!isGranted}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Tipos de Notificação</CardTitle>
          <CardDescription className="text-slate-400">
            Escolha quais eventos deseja ser notificado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries({
            propertyMatch: 'Novos Matches de Imóveis',
            priceChange: 'Mudanças de Preço',
            newProperty: 'Novos Imóveis Disponíveis',
            availabilityChange: 'Mudanças de Disponibilidade',
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <p className="text-slate-200">{label}</p>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPrefs.notificationTypes[key as keyof typeof localPrefs.notificationTypes]}
                  onChange={(e) => setLocalPrefs(prev => ({
                    ...prev,
                    notificationTypes: {
                      ...prev.notificationTypes,
                      [key]: e.target.checked
                    }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Filtros de Notificação</CardTitle>
          <CardDescription className="text-slate-400">
            Defina critérios para receber apenas alertas relevantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Match Score */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">
              Score Mínimo de Match
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={localPrefs.filters.minMatchScore}
              onChange={(e) => setLocalPrefs(prev => ({
                ...prev,
                filters: { ...prev.filters, minMatchScore: Number(e.target.value) }
              }))}
              className="bg-slate-800 border-slate-700 text-slate-100"
            />
            <p className="text-xs text-slate-500 mt-1">
              Apenas imóveis com score acima de {localPrefs.filters.minMatchScore}
            </p>
          </div>

          {/* Price Change */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">
              Mudança Mínima de Preço (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={localPrefs.filters.minPriceChange}
              onChange={(e) => setLocalPrefs(prev => ({
                ...prev,
                filters: { ...prev.filters, minPriceChange: Number(e.target.value) }
              }))}
              className="bg-slate-800 border-slate-700 text-slate-100"
            />
            <p className="text-xs text-slate-500 mt-1">
              Notificar mudanças de preço acima de {localPrefs.filters.minPriceChange}%
            </p>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Preço Mínimo (€)
              </label>
              <Input
                type="number"
                value={localPrefs.filters.priceRange.min}
                onChange={(e) => setLocalPrefs(prev => ({
                  ...prev,
                  filters: {
                    ...prev.filters,
                    priceRange: { ...prev.filters.priceRange, min: Number(e.target.value) }
                  }
                }))}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Preço Máximo (€)
              </label>
              <Input
                type="number"
                value={localPrefs.filters.priceRange.max}
                onChange={(e) => setLocalPrefs(prev => ({
                  ...prev,
                  filters: {
                    ...prev.filters,
                    priceRange: { ...prev.filters.priceRange, max: Number(e.target.value) }
                  }
                }))}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>
          </div>

          {/* Locations */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Localizações de Interesse
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                type="text"
                placeholder="Lisboa, Porto, etc."
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
              <Button
                variant="outline"
                onClick={addLocation}
              >
                Adicionar
              </Button>
            </div>
            {localPrefs.filters.locations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {localPrefs.filters.locations.map((location, index) => (
                  <div
                    key={index}
                    className="bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-sm text-slate-200 flex items-center gap-2"
                  >
                    <MapPin className="w-3 h-3" />
                    {location}
                    <button
                      onClick={() => removeLocation(location)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'A guardar...' : 'Guardar Preferências'}
        </Button>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
          <p className="text-emerald-400 font-medium">
            Preferências guardadas com sucesso!
          </p>
        </div>
      )}
    </div>
  );
}
