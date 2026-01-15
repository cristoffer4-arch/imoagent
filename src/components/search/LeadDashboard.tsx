/**
 * LeadDashboard - Dashboard de gestão de leads gerados a partir de matches
 */

'use client';

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  Users,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  Euro,
  Calendar,
  Filter,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface Lead {
  id: string;
  propertyId: string;
  propertyTitle: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: 'new' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost';
  source: string;
  score?: number;
  estimatedValue?: number;
  createdAt: Date;
  lastContact?: Date;
  notes?: string;
}

interface LeadDashboardProps {
  leads?: Lead[];
  onViewLead?: (leadId: string) => void;
  onUpdateLeadStatus?: (leadId: string, status: Lead['status']) => void;
  className?: string;
}

const STATUS_CONFIG = {
  new: { label: 'Novo', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100', icon: '🆕' },
  contacted: { label: 'Contactado', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100', icon: '📞' },
  qualified: { label: 'Qualificado', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100', icon: '✅' },
  negotiating: { label: 'Em Negociação', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100', icon: '🤝' },
  won: { label: 'Ganho', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100', icon: '🎉' },
  lost: { label: 'Perdido', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100', icon: '❌' },
};

export function LeadDashboard({
  leads = [],
  onViewLead,
  onUpdateLeadStatus,
  className,
}: LeadDashboardProps) {
  const [filterStatus, setFilterStatus] = useState<Lead['status'] | 'all'>('all');
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(leads);

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredLeads(leads);
    } else {
      setFilteredLeads(leads.filter(lead => lead.status === filterStatus));
    }
  }, [leads, filterStatus]);

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    won: leads.filter(l => l.status === 'won').length,
    totalValue: leads
      .filter(l => l.status === 'won' && l.estimatedValue)
      .reduce((sum, l) => sum + (l.estimatedValue || 0), 0),
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total de Leads</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-yellow-600" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.new}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Novos Leads</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.qualified}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Qualificados</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.won}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Convertidos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <span className="font-medium text-slate-900 dark:text-white">Filtrar por Status</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filterStatus === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            )}
          >
            Todos ({leads.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as Lead['status'])}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
                filterStatus === status
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              )}
            >
              <span>{config.icon}</span>
              {config.label} ({leads.filter(l => l.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {filteredLeads.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center border border-slate-200 dark:border-slate-700">
            <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              Nenhum lead encontrado com este filtro
            </p>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const statusConfig = STATUS_CONFIG[lead.status];
            return (
              <div
                key={lead.id}
                onClick={() => onViewLead?.(lead.id)}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {lead.propertyTitle}
                    </h3>
                    {lead.contactName && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {lead.contactName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.score !== undefined && (
                      <Badge variant="info" size="sm">
                        Score: {lead.score}%
                      </Badge>
                    )}
                    <span className={clsx('px-2 py-1 rounded text-xs font-medium', statusConfig.color)}>
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  {lead.contactEmail && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{lead.contactEmail}</span>
                    </div>
                  )}
                  {lead.contactPhone && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span>{lead.contactPhone}</span>
                    </div>
                  )}
                  {lead.estimatedValue && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Euro className="w-4 h-4" />
                      <span className="font-medium">{formatCurrency(lead.estimatedValue)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(lead.createdAt)}</span>
                  </div>
                </div>

                {lead.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {lead.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
