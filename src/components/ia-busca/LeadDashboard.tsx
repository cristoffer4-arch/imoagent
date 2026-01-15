/**
 * LeadDashboard - Main dashboard for property search leads
 * Mobile-first responsive design with real-time updates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Home, TrendingUp, Bell, Settings, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchResultsGrid } from './SearchResultsGrid';
import { MatchAlertPanel } from './MatchAlertPanel';
import { NotificationPreferences } from './NotificationPreferences';
import { useNotifications } from '@/services/notifications';
import type { PropertyMatch } from '@/services/notifications';

interface LeadDashboardProps {
  userId: string;
  initialProperties?: PropertyMatch[];
}

export function LeadDashboard({ userId, initialProperties = [] }: LeadDashboardProps) {
  const [activeView, setActiveView] = useState<'search' | 'alerts' | 'settings'>('search');
  const [properties, setProperties] = useState<PropertyMatch[]>(initialProperties);
  const [loading, setLoading] = useState(false);
  const { unreadCount } = useNotifications('all');

  // Mock data for demonstration
  useEffect(() => {
    if (properties.length === 0) {
      // Generate mock properties
      const mockProperties: PropertyMatch[] = [
        {
          propertyId: '1',
          matchScore: 92,
          matchReasons: [
            'Preço dentro do orçamento definido',
            'Localização premium próxima ao centro',
            'Imóvel recém-publicado com elevado potencial'
          ],
          property: {
            id: '1',
            title: 'Apartamento T3 Moderno em Lisboa',
            price: 450000,
            area: 120,
            bedrooms: 3,
            bathrooms: 2,
            location: 'Parque das Nações, Lisboa',
            images: [],
            angariaScore: 85,
            vendaScore: 78
          }
        },
        {
          propertyId: '2',
          matchScore: 88,
          matchReasons: [
            'Excelente score de venda (82/100)',
            'Área acima da média para a zona',
            'Disponível para visita imediata'
          ],
          property: {
            id: '2',
            title: 'Moradia V4 com Jardim no Porto',
            price: 680000,
            area: 250,
            bedrooms: 4,
            bathrooms: 3,
            location: 'Foz do Douro, Porto',
            images: [],
            angariaScore: 72,
            vendaScore: 82
          }
        },
        {
          propertyId: '3',
          matchScore: 75,
          matchReasons: [
            'Preço reduzido em 15% nas últimas 2 semanas',
            'Alta procura na zona',
            'Imóvel com certificação energética A+'
          ],
          property: {
            id: '3',
            title: 'Apartamento T2 Renovado em Cascais',
            price: 380000,
            area: 85,
            bedrooms: 2,
            bathrooms: 2,
            location: 'Centro Histórico, Cascais',
            images: [],
            angariaScore: 68,
            vendaScore: 71
          }
        }
      ];
      setProperties(mockProperties);
    }
  }, [properties.length]);

  const handleViewDetails = (propertyId: string) => {
    console.log('View property details:', propertyId);
    // Implement navigation to property details
  };

  const handleContact = (propertyId: string) => {
    console.log('Contact about property:', propertyId);
    // Implement contact functionality
  };

  const handleScheduleVisit = (propertyId: string) => {
    console.log('Schedule visit for property:', propertyId);
    // Implement visit scheduling
  };

  // Stats cards data
  const stats = [
    {
      title: 'Imóveis em Watch',
      value: properties.length,
      icon: Home,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Matches Recentes',
      value: properties.filter(p => p.matchScore >= 80).length,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      title: 'Alertas Ativos',
      value: unreadCount,
      icon: Bell,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Dashboard de Busca IA
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Gestão inteligente de imóveis com scoring automático
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-3 ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-100">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={activeView === 'search' ? 'primary' : 'outline'}
            onClick={() => setActiveView('search')}
            className="flex-shrink-0"
          >
            <Search className="w-4 h-4 mr-2" />
            Pesquisa
          </Button>
          <Button
            variant={activeView === 'alerts' ? 'primary' : 'outline'}
            onClick={() => setActiveView('alerts')}
            className="flex-shrink-0 relative"
          >
            <Bell className="w-4 h-4 mr-2" />
            Alertas
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button
            variant={activeView === 'settings' ? 'primary' : 'outline'}
            onClick={() => setActiveView('settings')}
            className="flex-shrink-0"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>

        {/* Content Area */}
        <div>
          {activeView === 'search' && (
            <SearchResultsGrid
              properties={properties}
              onViewDetails={handleViewDetails}
              onContact={handleContact}
              loading={loading}
            />
          )}

          {activeView === 'alerts' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MatchAlertPanel
                onViewProperty={handleViewDetails}
                onScheduleVisit={handleScheduleVisit}
                onContact={handleContact}
              />
              
              <Card className="bg-slate-950 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-100">
                    Próximas Ações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm">
                    Visitas agendadas, follow-ups e outras ações aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeView === 'settings' && (
            <NotificationPreferences userId={userId} />
          )}
        </div>
      </div>
    </div>
  );
}
