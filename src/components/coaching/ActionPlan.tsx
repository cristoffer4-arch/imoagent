"use client";

import { useState, useEffect } from 'react';
import { getActionItems, upsertActionItem } from '@/lib/supabase-coaching';
import type { ActionItem } from '@/types/coaching';

const CATEGORIES = [
  { value: 'calls', label: 'Ligações', icon: '📞', color: 'blue' },
  { value: 'visits', label: 'Visitas', icon: '🏠', color: 'purple' },
  { value: 'prospecting', label: 'Prospecção', icon: '🔍', color: 'amber' },
  { value: 'study', label: 'Estudo', icon: '📚', color: 'cyan' },
  { value: 'follow_up', label: 'Follow-up', icon: '📧', color: 'pink' },
];

const PRIORITIES = [
  { value: 'high', label: 'Alta', color: 'red' },
  { value: 'medium', label: 'Média', color: 'amber' },
  { value: 'low', label: 'Baixa', color: 'green' },
];

export function ActionPlan({ userId }: { userId: string }) {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'calls' as const,
    priority: 'medium' as const,
    due_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadItems();
  }, [userId]);

  async function loadItems() {
    try {
      setLoading(true);
      const data = await getActionItems(userId);
      setItems(data || []);
    } catch (error) {
      console.error('Error loading action items:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await upsertActionItem({
        user_id: userId,
        ...formData,
        status: 'pending',
      });
      await loadItems();
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        category: 'calls',
        priority: 'medium',
        due_date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error saving action item:', error);
    }
  }

  async function toggleStatus(item: ActionItem) {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    try {
      await upsertActionItem({
        id: item.id,
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      });
      await loadItems();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  async function generateAutoPlan() {
    setGenerating(true);
    try {
      const response = await fetch('/api/gemini-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Gere um plano de ação semanal completo para um consultor imobiliário focado em prospecção e vendas. Inclua atividades diárias específicas com horários sugeridos.',
              timestamp: new Date().toISOString(),
            },
          ],
          sessionType: 'action_plan',
          userContext: { userId },
        }),
      });

      const data = await response.json();
      
      // Parse the AI response and create action items
      // For now, create sample items based on best practices
      const sampleItems = [
        { title: 'Ligações de prospecção (9h-11h)', category: 'calls', priority: 'high', days: 0 },
        { title: 'Visitas a propriedades (14h-17h)', category: 'visits', priority: 'high', days: 0 },
        { title: 'Follow-up de leads quentes', category: 'follow_up', priority: 'high', days: 1 },
        { title: 'Atualizar anúncios Idealista', category: 'prospecting', priority: 'medium', days: 1 },
        { title: 'Estudar mercado local', category: 'study', priority: 'medium', days: 2 },
        { title: 'Networking imobiliário', category: 'prospecting', priority: 'medium', days: 3 },
        { title: 'Preparar propostas', category: 'calls', priority: 'high', days: 4 },
      ];

      for (const item of sampleItems) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + item.days);
        
        await upsertActionItem({
          user_id: userId,
          title: item.title,
          description: `Gerado automaticamente pelo plano IA`,
          category: item.category,
          priority: item.priority,
          status: 'pending',
          due_date: dueDate.toISOString().split('T')[0],
        });
      }

      await loadItems();
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setGenerating(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const overdue = items.filter(
    (i) => i.status !== 'completed' && i.due_date < today
  );
  const todayItems = items.filter(
    (i) => i.status !== 'completed' && i.due_date === today
  );
  const upcoming = items.filter(
    (i) => i.status !== 'completed' && i.due_date > today
  );
  const completed = items.filter((i) => i.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition"
        >
          + Nova Ação
        </button>
        <button
          onClick={generateAutoPlan}
          disabled={generating}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
        >
          {generating ? 'Gerando...' : '✨ Gerar Plano Automático'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6 space-y-4">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Título da ação"
            required
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição (opcional)"
            rows={3}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
          />
          <div className="grid grid-cols-3 gap-4">
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {PRIORITIES.map((pri) => (
                <option key={pri.value} value={pri.value}>
                  {pri.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg font-semibold hover:bg-slate-600 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <Section title="⚠️ Atrasadas" items={overdue} onToggle={toggleStatus} />
      )}

      {/* Today */}
      <Section title="📅 Hoje" items={todayItems} onToggle={toggleStatus} />

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Section title="🔜 Próximas" items={upcoming} onToggle={toggleStatus} />
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <Section title="✅ Concluídas" items={completed} onToggle={toggleStatus} />
      )}
    </div>
  );
}

function Section({
  title,
  items,
  onToggle,
}: {
  title: string;
  items: ActionItem[];
  onToggle: (item: ActionItem) => void;
}) {
  return (
    <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6">
      <h4 className="text-lg font-semibold text-slate-100 mb-4">{title}</h4>
      <div className="space-y-3">
        {items.map((item) => {
          const category = CATEGORIES.find((c) => c.value === item.category);
          const priority = PRIORITIES.find((p) => p.value === item.priority);
          
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-slate-600 transition"
            >
              <input
                type="checkbox"
                checked={item.status === 'completed'}
                onChange={() => onToggle(item)}
                className="mt-1 w-5 h-5 accent-emerald-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{category?.icon}</span>
                  <h5
                    className={`font-semibold ${
                      item.status === 'completed'
                        ? 'line-through text-slate-500'
                        : 'text-slate-100'
                    }`}
                  >
                    {item.title}
                  </h5>
                </div>
                {item.description && (
                  <p className="text-sm text-slate-400 mb-2">{item.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`px-2 py-1 rounded-full bg-${priority?.color}-500/20 text-${priority?.color}-300 border border-${priority?.color}-500/30`}
                  >
                    {priority?.label}
                  </span>
                  <span className="text-slate-500">
                    {new Date(item.due_date).toLocaleDateString('pt-PT')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
