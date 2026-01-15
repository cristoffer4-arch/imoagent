import { useState } from 'react';
import { Property } from '@/types/busca-ia';
import { FileText, UserPlus, Bell, BarChart3, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ActionButtonsProps {
  property: Property;
  mode: 'angariacao' | 'venda';
}

export function ActionButtons({ property, mode }: ActionButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCreateOpportunity = async () => {
    setLoading('opportunity');
    try {
      const response = await fetch('/api/ia-busca/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: mode === 'angariacao' ? 'ANGARIACAO' : 'VENDA',
          property_id: property.id,
          tenant_id: property.tenant_id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Oportunidade criada com sucesso!');
      } else {
        toast.error('Erro ao criar oportunidade');
      }
    } catch (error) {
      toast.error('Erro ao criar oportunidade');
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateACM = async () => {
    setLoading('acm');
    try {
      const response = await fetch('/api/ia-busca/acm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: property.id,
          tenant_id: property.tenant_id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Relatório ACM gerado!');
        // In production, open PDF or show report
        console.log('ACM Report:', data.report);
      } else {
        toast.error('Erro ao gerar ACM');
      }
    } catch (error) {
      toast.error('Erro ao gerar ACM');
    } finally {
      setLoading(null);
    }
  };

  const handleCreateAlert = async () => {
    setLoading('alert');
    try {
      const response = await fetch('/api/ia-busca/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          filters: {
            mode,
            location: { concelho: property.concelho },
            typology: [property.typology],
            min_score: 70,
          },
          notification_channels: ['email'],
          tenant_id: property.tenant_id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Alerta criado com sucesso!');
      } else {
        toast.error('Erro ao criar alerta');
      }
    } catch (error) {
      toast.error('Erro ao criar alerta');
    } finally {
      setLoading(null);
    }
  };

  const buttons = [
    {
      id: 'opportunity',
      label: mode === 'angariacao' ? 'Criar Oportunidade Angariação' : 'Criar Oportunidade Venda',
      icon: Plus,
      onClick: handleCreateOpportunity,
      color: mode === 'angariacao' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'acm',
      label: 'Gerar ACM',
      icon: BarChart3,
      onClick: handleGenerateACM,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      id: 'alert',
      label: 'Criar Alerta Similar',
      icon: Bell,
      onClick: handleCreateAlert,
      color: 'bg-yellow-500 hover:bg-yellow-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {buttons.map((button) => (
        <button
          key={button.id}
          onClick={button.onClick}
          disabled={loading !== null}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${button.color} text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <button.icon size={18} />
          <span className="text-sm">{button.label}</span>
          {loading === button.id && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
        </button>
      ))}
    </div>
  );
}
