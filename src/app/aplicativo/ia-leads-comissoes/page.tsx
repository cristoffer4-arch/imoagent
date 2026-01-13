'use client'

import { useState } from 'react'
import { Users, Plus, TrendingUp, Euro, Phone, Mail, Star, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type LeadStage = 'novo' | 'contactado' | 'negociacao' | 'fechado'

interface Lead {
  id: number
  name: string
  email: string
  phone: string
  interest: string
  source: string
  score: number
  value: number
  stage: LeadStage
  daysInStage: number
  lastContact: string
}

const MOCK_LEADS: Lead[] = [
  {
    id: 1,
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '+351 912 345 678',
    interest: 'Apartamento T2 Lisboa',
    source: 'Website',
    score: 85,
    value: 385000,
    stage: 'negociacao',
    daysInStage: 3,
    lastContact: 'Há 1 dia',
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '+351 923 456 789',
    interest: 'Moradia T3 Porto',
    source: 'Facebook',
    score: 72,
    value: 550000,
    stage: 'contactado',
    daysInStage: 2,
    lastContact: 'Há 2 dias',
  },
  {
    id: 3,
    name: 'Pedro Costa',
    email: 'pedro.costa@email.com',
    phone: '+351 934 567 890',
    interest: 'Apartamento T1 Coimbra',
    source: 'Idealista',
    score: 45,
    value: 220000,
    stage: 'novo',
    daysInStage: 1,
    lastContact: 'Nunca',
  },
  {
    id: 4,
    name: 'Ana Ferreira',
    email: 'ana.ferreira@email.com',
    phone: '+351 945 678 901',
    interest: 'Moradia T4 Cascais',
    source: 'Referência',
    score: 92,
    value: 890000,
    stage: 'fechado',
    daysInStage: 45,
    lastContact: 'Há 45 dias',
  },
]

const COMMISSIONS = [
  { id: 1, property: 'Apartamento T2 Lisboa', value: 385000, rate: 5, amount: 19250, status: 'Pago', date: '05 Jan 2026' },
  { id: 2, property: 'Moradia T3 Porto', value: 550000, rate: 4.5, amount: 24750, status: 'Pendente', date: '12 Jan 2026' },
  { id: 3, property: 'Apartamento T1 Faro', value: 220000, rate: 5, amount: 11000, status: 'Pago', date: '28 Dez 2025' },
]

const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; bgColor: string }> = {
  novo: { label: 'Novo', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  contactado: { label: 'Contactado', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  negociacao: { label: 'Negociação', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  fechado: { label: 'Fechado', color: 'text-green-700', bgColor: 'bg-green-50' },
}

export default function IALeadsComissoesPage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS)
  const [showNewLeadForm, setShowNewLeadForm] = useState(false)
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    interest: '',
    source: '',
  })

  const getLeadsByStage = (stage: LeadStage) => leads.filter(lead => lead.stage === stage)

  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    e.dataTransfer.setData('leadId', leadId.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault()
    const leadId = parseInt(e.dataTransfer.getData('leadId'))
    setLeads(leads.map(lead =>
      lead.id === leadId ? { ...lead, stage: targetStage, daysInStage: 0 } : lead
    ))
  }

  const totalCommissions = COMMISSIONS.reduce((sum, c) => sum + c.amount, 0)
  const pendingCommissions = COMMISSIONS.filter(c => c.status === 'Pendente').reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-cyan-100/70 p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">👥 Leads & Comissões</h1>
          <p className="text-gray-700">Qualifique leads automaticamente e acompanhe comissões com transparência.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8" />
              <span className="text-3xl font-bold">{leads.length}</span>
            </div>
            <p className="text-sm font-medium text-blue-100">Total de Leads</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8" />
              <span className="text-3xl font-bold">67%</span>
            </div>
            <p className="text-sm font-medium text-green-100">Taxa de Conversão</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8" />
              <span className="text-3xl font-bold">73</span>
            </div>
            <p className="text-sm font-medium text-purple-100">Score Médio</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Euro className="w-8 h-8" />
              <span className="text-3xl font-bold">€55K</span>
            </div>
            <p className="text-sm font-medium text-orange-100">Comissões Este Mês</p>
          </div>
        </div>

        {/* New Lead Button */}
        {!showNewLeadForm && (
          <Button
            onClick={() => setShowNewLeadForm(true)}
            className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Novo Lead
          </Button>
        )}

        {/* New Lead Form */}
        {showNewLeadForm && (
          <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-cyan-100/70 p-8 backdrop-blur-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Novo Lead</h2>
              <Button variant="ghost" onClick={() => setShowNewLeadForm(false)}>
                Cancelar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <Input
                  placeholder="Ex: João Silva"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="joao.silva@email.com"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <Input
                  placeholder="+351 912 345 678"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Origem</label>
                <select
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                  className="w-full h-10 rounded-xl border border-gray-300 px-3 bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  <option value="Website">Website</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Idealista">Idealista</option>
                  <option value="Referência">Referência</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Interesse</label>
                <Input
                  placeholder="Ex: Apartamento T2 em Lisboa"
                  value={newLead.interest}
                  onChange={(e) => setNewLead({ ...newLead, interest: e.target.value })}
                />
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
              <Plus className="w-5 h-5 mr-2" />
              Criar Lead
            </Button>
          </div>
        )}

        {/* Pipeline */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-cyan-100/70 p-8 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Pipeline de Leads</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['novo', 'contactado', 'negociacao', 'fechado'] as LeadStage[]).map((stage) => {
              const config = STAGE_CONFIG[stage]
              const stageLeads = getLeadsByStage(stage)
              return (
                <div
                  key={stage}
                  className={`rounded-2xl ${config.bgColor} p-4 min-h-[400px]`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-bold ${config.color}`}>{config.label}</h3>
                    <span className={`text-sm font-semibold ${config.color}`}>{stageLeads.length}</span>
                  </div>
                  <div className="space-y-3">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-all cursor-move"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm">{lead.name}</h4>
                          <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                            lead.score >= 80 ? 'bg-green-100 text-green-700' :
                            lead.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {lead.score}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-3 line-clamp-1">{lead.interest}</p>
                        <div className="space-y-1 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{lead.phone}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{lead.source}</span>
                          <span className="font-semibold text-green-600">€{(lead.value / 1000).toFixed(0)}K</span>
                        </div>
                        {lead.daysInStage > 5 && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                            <AlertCircle className="w-3 h-3" />
                            <span>{lead.daysInStage} dias nesta fase</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Commissions Table */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-cyan-100/70 p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Comissões</h2>
            <div className="flex gap-4 text-sm">
              <div className="text-right">
                <p className="text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">€{totalCommissions.toLocaleString('pt-PT')}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">Pendente</p>
                <p className="text-2xl font-bold text-orange-600">€{pendingCommissions.toLocaleString('pt-PT')}</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Propriedade</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Taxa</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Comissão</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Data</th>
                </tr>
              </thead>
              <tbody>
                {COMMISSIONS.map((commission) => (
                  <tr key={commission.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-900">{commission.property}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">€{commission.value.toLocaleString('pt-PT')}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">{commission.rate}%</td>
                    <td className="py-4 px-4 text-sm font-semibold text-green-600">€{commission.amount.toLocaleString('pt-PT')}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        commission.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {commission.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{commission.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
