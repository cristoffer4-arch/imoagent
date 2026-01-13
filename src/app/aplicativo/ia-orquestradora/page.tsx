'use client'

import { useState } from 'react'
import { Calendar, Plus, Clock, Bell, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MOCK_EVENTS = [
  { id: 1, title: 'Reunião Cliente Santos', date: '2026-01-15', time: '10:00', type: 'meeting', agent: 'leads' },
  { id: 2, title: 'Visita Apartamento T2 Lisboa', date: '2026-01-15', time: '14:30', type: 'visit', agent: 'busca' },
  { id: 3, title: 'Assinatura Contrato Porto', date: '2026-01-16', time: '11:00', type: 'contract', agent: 'legal' },
  { id: 4, title: 'Revisão Meta Mensal', date: '2026-01-17', time: '09:00', type: 'goal', agent: 'coaching' },
  { id: 5, title: 'Upload Fotos Anúncio', date: '2026-01-17', time: '15:00', type: 'task', agent: 'anuncios' },
]

const NOTIFICATIONS = [
  { id: 1, icon: '🔔', title: 'Follow-up pendente', message: '5 leads sem contacto há 3+ dias', priority: 'high', agent: 'leads' },
  { id: 2, icon: '📝', title: 'Contrato para revisar', message: 'Contrato_Arrendamento_Porto.pdf aguarda análise', priority: 'medium', agent: 'legal' },
  { id: 3, icon: '🎯', title: 'Meta próxima do prazo', message: 'Fechar 10 vendas - faltam 5 dias', priority: 'medium', agent: 'coaching' },
  { id: 4, icon: '🏆', title: 'Novo desafio disponível', message: 'Vendedor Relâmpago - +500 XP', priority: 'low', agent: 'gamificacao' },
]

const AGENT_SUMMARY = [
  { id: 'busca', name: 'Busca', icon: '🔍', color: 'blue', stats: { label: 'Propriedades', value: 156 } },
  { id: 'coaching', name: 'Coaching', icon: '🎯', color: 'purple', stats: { label: 'Metas Ativas', value: 2 } },
  { id: 'gamificacao', name: 'Gamificação', icon: '🏆', color: 'yellow', stats: { label: 'Ranking', value: '#6' } },
  { id: 'anuncios', name: 'Anúncios', icon: '📈', color: 'green', stats: { label: 'CTR Médio', value: '6.8%' } },
  { id: 'legal', name: 'Legal', icon: '⚖️', color: 'indigo', stats: { label: 'Contratos', value: 3 } },
  { id: 'leads', name: 'Leads', icon: '👥', color: 'cyan', stats: { label: 'Pipeline', value: 47 } },
]

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function IAOrquestradoraPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 15)) // Jan 15, 2026
  const [showNewEventForm, setShowNewEventForm] = useState(false)
  const [pomodoroActive, setPomodoroActive] = useState(false)
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60) // 25 minutes in seconds

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate)
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1
    return day > 0 && day <= daysInMonth ? day : null
  })

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `2026-01-${day.toString().padStart(2, '0')}`
    return MOCK_EVENTS.filter(e => e.date === dateStr)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-pink-100/70 p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Agenda IA Orquestradora</h1>
          <p className="text-gray-700">Coordene todos os agentes de IA, agenda e notificações a partir de um único hub.</p>
        </div>

        {/* Dashboard Summary */}
        <div className="rounded-3xl bg-gradient-to-r from-pink-600 to-purple-600 p-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Resumo Geral</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {AGENT_SUMMARY.map((agent) => (
              <div key={agent.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/20 transition-all cursor-pointer">
                <div className="text-3xl mb-2">{agent.icon}</div>
                <div className="text-2xl font-bold mb-1">{agent.stats.value}</div>
                <div className="text-xs text-white/80">{agent.stats.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 rounded-3xl bg-white/80 shadow-lg ring-1 ring-pink-100/70 p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-pink-600" />
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, i) => {
                const events = day ? getEventsForDay(day) : []
                const isToday = day === 15 // Mock today as 15th
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-xl p-2 text-center transition-all ${
                      day
                        ? isToday
                          ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white font-bold shadow-lg'
                          : events.length > 0
                          ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer'
                          : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                        : 'bg-transparent'
                    }`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-white' : 'text-gray-900'}`}>
                          {day}
                        </div>
                        {events.length > 0 && (
                          <div className="flex flex-col gap-0.5">
                            {events.slice(0, 2).map(event => (
                              <div key={event.id} className="w-full h-1 bg-purple-600 rounded-full" />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            <Button
              onClick={() => setShowNewEventForm(!showNewEventForm)}
              className="w-full mt-6 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Evento
            </Button>

            {showNewEventForm && (
              <div className="mt-6 p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl space-y-4">
                <Input placeholder="Título do evento" />
                <div className="grid grid-cols-2 gap-4">
                  <Input type="date" />
                  <Input type="time" />
                </div>
                <select className="w-full h-10 rounded-xl border border-gray-300 px-3 bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none">
                  <option>Reunião</option>
                  <option>Visita</option>
                  <option>Contrato</option>
                  <option>Meta</option>
                  <option>Tarefa</option>
                </select>
                <Button className="w-full">Criar Evento</Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Events */}
            <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-pink-100/70 p-6 backdrop-blur-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Hoje - 15 Jan
              </h3>
              <div className="space-y-3">
                {MOCK_EVENTS.filter(e => e.date === '2026-01-15').map((event) => (
                  <div key={event.id} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-semibold text-sm text-gray-900">{event.title}</span>
                      <span className="text-xs font-medium text-purple-600">{event.time}</span>
                    </div>
                    <span className="text-xs text-gray-600 capitalize">{event.type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pomodoro Timer */}
            <div className="rounded-3xl bg-gradient-to-br from-red-500 to-orange-600 p-6 text-white shadow-lg">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Técnica Pomodoro
              </h3>
              <div className="text-center">
                <div className="text-5xl font-bold mb-4">{formatTime(pomodoroTime)}</div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPomodoroActive(!pomodoroActive)}
                    className="flex-1 bg-white/20 hover:bg-white/30"
                  >
                    {pomodoroActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button
                    onClick={() => setPomodoroTime(25 * 60)}
                    className="flex-1 bg-white/20 hover:bg-white/30"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-pink-100/70 p-6 backdrop-blur-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-600" />
                Notificações
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {NOTIFICATIONS.filter(n => n.priority === 'high').length}
                </span>
              </h3>
              <div className="space-y-3">
                {NOTIFICATIONS.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-xl ${
                      notification.priority === 'high' ? 'bg-red-50' :
                      notification.priority === 'medium' ? 'bg-yellow-50' : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{notification.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-900 mb-1">{notification.title}</h4>
                        <p className="text-xs text-gray-600">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Agent Activities */}
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-pink-100/70 p-8 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Atividades Recentes dos Agentes</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
              <div className="text-3xl">🔍</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Busca Inteligente</h4>
                <p className="text-sm text-gray-600">156 propriedades encontradas em 7 portais</p>
              </div>
              <span className="text-sm text-gray-500">Há 2h</span>
            </div>
            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl">
              <div className="text-3xl">🎯</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Coaching SMART</h4>
                <p className="text-sm text-gray-600">Meta &quot;Fechar 10 vendas&quot; - 60% completa</p>
              </div>
              <span className="text-sm text-gray-500">Há 4h</span>
            </div>
            <div className="flex items-center gap-4 p-4 bg-cyan-50 rounded-2xl">
              <div className="text-3xl">👥</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Leads & Comissões</h4>
                <p className="text-sm text-gray-600">3 novos leads adicionados ao pipeline</p>
              </div>
              <span className="text-sm text-gray-500">Há 6h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
