"use client";

import { useState, useEffect } from 'react';
import { getKPIs } from '@/lib/supabase-coaching';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function KPIDashboard({ userId }: { userId: string }) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKPIs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, period]);

  async function loadKPIs() {
    try {
      setLoading(true);
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const data = await getKPIs(userId, startDate.toISOString().split('T')[0]);
      setKpis(data || []);
    } catch (error) {
      console.error('Error loading KPIs:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate aggregated metrics
  const totals = kpis.reduce(
    (acc, kpi) => ({
      leads: acc.leads + (kpi.leads_generated || 0),
      visits: acc.visits + (kpi.visits_completed || 0),
      listings: acc.listings + (kpi.properties_listed || 0),
      sales: acc.sales + (kpi.properties_sold || 0),
      commissions: acc.commissions + (kpi.commissions || 0),
    }),
    { leads: 0, visits: 0, listings: 0, sales: 0, commissions: 0 }
  );

  const avgConversion = kpis.length > 0
    ? kpis.reduce((sum, kpi) => sum + (kpi.conversion_rate || 0), 0) / kpis.length
    : 0;

  const avgTicket = kpis.length > 0
    ? kpis.reduce((sum, kpi) => sum + (kpi.average_ticket || 0), 0) / kpis.length
    : 0;

  // Funnel data
  const funnelData = [
    { name: 'Leads', value: totals.leads, color: '#3b82f6' },
    { name: 'Visitas', value: totals.visits, color: '#8b5cf6' },
    { name: 'Angariações', value: totals.listings, color: '#f59e0b' },
    { name: 'Vendas', value: totals.sales, color: '#10b981' },
  ];

  // Time series data
  const timeSeriesData = kpis.map(kpi => ({
    date: new Date(kpi.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
    leads: kpi.leads_generated || 0,
    visits: kpi.visits_completed || 0,
    vendas: kpi.properties_sold || 0,
  }));

  // Weekly comparison data (mock for now)
  const weeklyData = [
    { week: 'Sem 1', leads: 12, visits: 8, vendas: 2 },
    { week: 'Sem 2', leads: 15, visits: 10, vendas: 3 },
    { week: 'Sem 3', leads: 18, visits: 12, vendas: 4 },
    { week: 'Sem 4', leads: 14, visits: 9, vendas: 2 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              period === p
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Leads Gerados"
          value={totals.leads}
          icon="📞"
          gradient="from-blue-500/20 to-blue-600/20"
          change="+12%"
        />
        <KPICard
          label="Visitas"
          value={totals.visits}
          icon="🏠"
          gradient="from-purple-500/20 to-purple-600/20"
          change="+8%"
        />
        <KPICard
          label="Angariações"
          value={totals.listings}
          icon="📋"
          gradient="from-amber-500/20 to-amber-600/20"
          change="+15%"
        />
        <KPICard
          label="Vendas"
          value={totals.sales}
          icon="✅"
          gradient="from-emerald-500/20 to-emerald-600/20"
          change="+5%"
        />
        <KPICard
          label="Taxa Conversão"
          value={`${avgConversion.toFixed(1)}%`}
          icon="📊"
          gradient="from-cyan-500/20 to-cyan-600/20"
        />
        <KPICard
          label="Ticket Médio"
          value={`€${Math.round(avgTicket).toLocaleString()}`}
          icon="💰"
          gradient="from-green-500/20 to-green-600/20"
        />
        <KPICard
          label="Comissões"
          value={`€${Math.round(totals.commissions).toLocaleString()}`}
          icon="💵"
          gradient="from-emerald-500/20 to-emerald-600/20"
          change="+18%"
        />
        <KPICard
          label="Pipeline"
          value={totals.leads - totals.sales}
          icon="🔄"
          gradient="from-indigo-500/20 to-indigo-600/20"
        />
      </div>

      {/* Time Series Chart */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6">
        <h4 className="text-lg font-semibold text-slate-100 mb-4">📈 Progresso Temporal</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} name="Leads" />
            <Line type="monotone" dataKey="visits" stroke="#8b5cf6" strokeWidth={2} name="Visitas" />
            <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={2} name="Vendas" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel and Weekly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6">
          <h4 className="text-lg font-semibold text-slate-100 mb-4">🎯 Funil de Vendas</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={funnelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Comparison */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6">
          <h4 className="text-lg font-semibold text-slate-100 mb-4">📊 Comparação Semanal</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="week" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
              <Bar dataKey="visits" fill="#8b5cf6" name="Visitas" />
              <Bar dataKey="vendas" fill="#10b981" name="Vendas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  icon,
  gradient,
  change,
}: {
  label: string;
  value: string | number;
  icon: string;
  gradient: string;
  change?: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} border border-white/10 p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {change && (
          <span className="text-xs font-semibold text-emerald-400">{change}</span>
        )}
      </div>
      <h4 className="text-sm font-medium text-slate-300 mb-1">{label}</h4>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}
