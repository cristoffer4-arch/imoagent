"use client";

import { useState, useEffect } from 'react';
import { getGoals, upsertGoal } from '@/lib/supabase-coaching';

export function SmartGoals({ userId }: { userId: string }) {
  const [annualTarget, setAnnualTarget] = useState(100000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Derived goals based on real estate metrics
  const averageCommission = 0.05; // 5%
  const averageTicket = annualTarget * averageCommission / 12; // Monthly ticket
  const closingsNeeded = Math.ceil(annualTarget / (averageTicket * 12));
  const conversionRate = 0.15; // 15% conversion
  const proposalsNeeded = Math.ceil(closingsNeeded / conversionRate);
  const listingsNeeded = Math.ceil(proposalsNeeded * 1.5);
  const visitsNeeded = Math.ceil(listingsNeeded * 2);
  const leadsNeeded = Math.ceil(visitsNeeded * 3);

  // Monthly breakdown
  const monthlyMetrics = {
    revenue: Math.round(annualTarget / 12),
    leads: Math.ceil(leadsNeeded / 12),
    visits: Math.ceil(visitsNeeded / 12),
    listings: Math.ceil(listingsNeeded / 12),
    proposals: Math.ceil(proposalsNeeded / 12),
    closings: Math.ceil(closingsNeeded / 12),
  };

  // Weekly and daily breakdown
  const weeklyMetrics = {
    leads: Math.ceil(monthlyMetrics.leads / 4),
    visits: Math.ceil(monthlyMetrics.visits / 4),
    listings: Math.ceil(monthlyMetrics.listings / 4),
  };

  const dailyMetrics = {
    leads: Math.ceil(monthlyMetrics.leads / 22), // 22 working days
    visits: Math.ceil(monthlyMetrics.visits / 22),
    calls: Math.ceil(monthlyMetrics.leads / 22 * 3), // 3 calls per lead
  };

  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function loadGoals() {
    try {
      setLoading(true);
      const data = await getGoals(userId);
      if (data) {
        setAnnualTarget(data.annual_revenue_target);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveGoals() {
    try {
      setSaving(true);
      await upsertGoal({
        user_id: userId,
        annual_revenue_target: annualTarget,
        monthly_leads_target: monthlyMetrics.leads,
        monthly_visits_target: monthlyMetrics.visits,
        monthly_listings_target: monthlyMetrics.listings,
        monthly_proposals_target: monthlyMetrics.proposals,
        monthly_closings_target: monthlyMetrics.closings,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving goals:', error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Annual Revenue Target */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 p-6">
        <h3 className="text-xl font-bold text-emerald-100 mb-4">Meta de Faturamento Anual</h3>
        <div className="flex items-center gap-4 mb-4">
          <input
            type="range"
            min="50000"
            max="500000"
            step="10000"
            value={annualTarget}
            onChange={(e) => setAnnualTarget(Number(e.target.value))}
            className="flex-1 h-2 bg-emerald-500/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-emerald-400">€</span>
            <input
              type="number"
              value={annualTarget}
              onChange={(e) => setAnnualTarget(Number(e.target.value))}
              className="w-32 px-3 py-2 bg-slate-800 border border-emerald-500/50 rounded-lg text-emerald-100 font-mono text-lg"
            />
          </div>
        </div>
        <button
          onClick={saveGoals}
          disabled={saving}
          className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Metas'}
        </button>
      </div>

      {/* Monthly Targets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Leads/Mês"
          value={monthlyMetrics.leads}
          icon="📞"
          gradient="from-blue-500/20 to-blue-600/20"
        />
        <MetricCard
          label="Visitas/Mês"
          value={monthlyMetrics.visits}
          icon="🏠"
          gradient="from-purple-500/20 to-purple-600/20"
        />
        <MetricCard
          label="Angariações/Mês"
          value={monthlyMetrics.listings}
          icon="📋"
          gradient="from-amber-500/20 to-amber-600/20"
        />
        <MetricCard
          label="Propostas/Mês"
          value={monthlyMetrics.proposals}
          icon="📄"
          gradient="from-pink-500/20 to-pink-600/20"
        />
        <MetricCard
          label="Fechos/Mês"
          value={monthlyMetrics.closings}
          icon="✅"
          gradient="from-emerald-500/20 to-emerald-600/20"
        />
        <MetricCard
          label="Receita/Mês"
          value={`€${monthlyMetrics.revenue.toLocaleString()}`}
          icon="💰"
          gradient="from-green-500/20 to-green-600/20"
        />
      </div>

      {/* Weekly Breakdown */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6">
        <h4 className="text-lg font-semibold text-slate-100 mb-4">📅 Meta Semanal</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{weeklyMetrics.leads}</div>
            <div className="text-sm text-slate-400">Leads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{weeklyMetrics.visits}</div>
            <div className="text-sm text-slate-400">Visitas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{weeklyMetrics.listings}</div>
            <div className="text-sm text-slate-400">Angariações</div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6">
        <h4 className="text-lg font-semibold text-slate-100 mb-4">📆 Meta Diária</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{dailyMetrics.leads}</div>
            <div className="text-sm text-slate-400">Leads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{dailyMetrics.visits}</div>
            <div className="text-sm text-slate-400">Visitas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{dailyMetrics.calls}</div>
            <div className="text-sm text-slate-400">Ligações</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  gradient,
}: {
  label: string;
  value: string | number;
  icon: string;
  gradient: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} border border-white/10 p-4`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <h4 className="text-sm font-medium text-slate-300">{label}</h4>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}
