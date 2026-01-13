'use client'

import { useState } from 'react'
import { Target, Plus, TrendingUp, CheckCircle2, Clock, Lightbulb, Calendar, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MOCK_GOALS = [
  {
    id: 1,
    title: 'Fechar 10 vendas este mês',
    specific: 'Vender 10 propriedades',
    measurable: '10 vendas',
    achievable: 'Baseado em histórico',
    relevant: 'Aumentar comissões',
    timeBound: '31 Jan 2026',
    progress: 60,
    status: 'em_progresso',
    daysLeft: 18,
  },
  {
    id: 2,
    title: 'Gerar 50 novos leads qualificados',
    specific: 'Captar 50 leads com score >70',
    measurable: '50 leads',
    achievable: 'Com campanhas digitais',
    relevant: 'Expandir pipeline',
    timeBound: '15 Fev 2026',
    progress: 34,
    status: 'em_progresso',
    daysLeft: 33,
  },
  {
    id: 3,
    title: 'Completar certificação PNL',
    specific: 'Curso de 40 horas',
    measurable: '100% módulos',
    achievable: '2h por semana',
    relevant: 'Melhorar negociação',
    timeBound: '28 Fev 2026',
    progress: 100,
    status: 'concluida',
    daysLeft: 0,
  },
]

const INSIGHTS = [
  {
    id: 1,
    icon: '🎯',
    title: 'Foco na manhã',
    description: 'Seus melhores resultados acontecem entre 9h-12h. Agende reuniões importantes nesse período.',
  },
  {
    id: 2,
    icon: '📞',
    title: 'Follow-up pendente',
    description: '5 leads não contactados há mais de 3 dias. Priorize hoje!',
  },
  {
    id: 3,
    icon: '🏆',
    title: 'Parabéns!',
    description: 'Você está 20% acima da meta semanal. Continue assim!',
  },
]

export default function IACoachingPage() {
  const [showNewGoalForm, setShowNewGoalForm] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-purple-100/70 p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 Coaching SMART</h1>
          <p className="text-gray-700">Planeie e acompanhe metas com recomendações em tempo real e rotinas orientadas por IA.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-8 h-8" />
              <span className="text-3xl font-bold">1</span>
            </div>
            <p className="text-sm font-medium text-green-100">Metas Concluídas</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8" />
              <span className="text-3xl font-bold">2</span>
            </div>
            <p className="text-sm font-medium text-blue-100">Metas Ativas</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8" />
              <span className="text-3xl font-bold">47%</span>
            </div>
            <p className="text-sm font-medium text-orange-100">Média de Progresso</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8" />
              <span className="text-3xl font-bold">18</span>
            </div>
            <p className="text-sm font-medium text-purple-100">Dias até próximo prazo</p>
          </div>
        </div>

        {/* New Goal Button */}
        {!showNewGoalForm && (
          <Button
            onClick={() => setShowNewGoalForm(true)}
            className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Meta SMART
          </Button>
        )}

        {/* New Goal Form */}
        {showNewGoalForm && (
          <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-purple-100/70 p-8 backdrop-blur-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Criar Nova Meta SMART</h2>
              <Button variant="ghost" onClick={() => setShowNewGoalForm(false)}>
                Cancelar
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título da Meta</label>
                <Input
                  placeholder="Ex: Fechar 10 vendas este mês"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-purple-600 font-bold">S</span>pecífica
                  </label>
                  <Input
                    placeholder="O que exatamente você quer alcançar?"
                    value={newGoal.specific}
                    onChange={(e) => setNewGoal({ ...newGoal, specific: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-purple-600 font-bold">M</span>ensurável
                  </label>
                  <Input
                    placeholder="Como vai medir o progresso?"
                    value={newGoal.measurable}
                    onChange={(e) => setNewGoal({ ...newGoal, measurable: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-purple-600 font-bold">A</span>tingível
                  </label>
                  <Input
                    placeholder="É realista? Como vai conseguir?"
                    value={newGoal.achievable}
                    onChange={(e) => setNewGoal({ ...newGoal, achievable: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-purple-600 font-bold">R</span>elevante
                  </label>
                  <Input
                    placeholder="Por que isso é importante?"
                    value={newGoal.relevant}
                    onChange={(e) => setNewGoal({ ...newGoal, relevant: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-purple-600 font-bold">T</span>emporal
                  </label>
                  <Input
                    type="date"
                    value={newGoal.timeBound}
                    onChange={(e) => setNewGoal({ ...newGoal, timeBound: e.target.value })}
                  />
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Target className="w-5 h-5 mr-2" />
                Criar Meta
              </Button>
            </div>
          </div>
        )}

        {/* Active Goals */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Metas Ativas</h2>
          {MOCK_GOALS.map((goal) => (
            <div
              key={goal.id}
              className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-purple-100/70 p-6 backdrop-blur-sm hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{goal.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {goal.status === 'concluida' ? 'Concluída' : `${goal.daysLeft} dias restantes`}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {goal.timeBound}
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  goal.status === 'concluida' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {goal.progress}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      goal.status === 'concluida'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : 'bg-gradient-to-r from-purple-500 to-pink-600'
                    }`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>

              {/* SMART Details */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div className="bg-purple-50 rounded-lg p-2">
                  <p className="font-semibold text-purple-700 mb-1">Específica</p>
                  <p className="text-gray-600">{goal.specific}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="font-semibold text-blue-700 mb-1">Mensurável</p>
                  <p className="text-gray-600">{goal.measurable}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="font-semibold text-green-700 mb-1">Atingível</p>
                  <p className="text-gray-600">{goal.achievable}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-2">
                  <p className="font-semibold text-orange-700 mb-1">Relevante</p>
                  <p className="text-gray-600">{goal.relevant}</p>
                </div>
                <div className="bg-pink-50 rounded-lg p-2">
                  <p className="font-semibold text-pink-700 mb-1">Temporal</p>
                  <p className="text-gray-600">{goal.timeBound}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Insights & Recommendations */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-purple-100/70 p-8 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Insights & Recomendações IA
          </h2>
          <div className="space-y-4">
            {INSIGHTS.map((insight) => (
              <div
                key={insight.id}
                className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl hover:from-purple-100 hover:to-pink-100 transition-all"
              >
                <span className="text-3xl">{insight.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evolution Chart Placeholder */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-purple-100/70 p-8 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Evolução Mensal
          </h2>
          <div className="w-full h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Gráfico de evolução em desenvolvimento</p>
              <p className="text-sm text-gray-500 mt-2">Visualize seu progresso ao longo do tempo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
