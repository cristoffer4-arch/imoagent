'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search, Target, Trophy, TrendingUp, FileText, Users, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()

  const stats = [
    { label: 'Propriedades Ativas', value: '42', icon: Home, color: 'text-blue-500' },
    { label: 'Leads Novos', value: '18', icon: Users, color: 'text-green-500' },
    { label: 'Metas Concluídas', value: '5/8', icon: Target, color: 'text-purple-500' },
    { label: 'Ranking Mensal', value: '#3', icon: Trophy, color: 'text-yellow-500' },
  ]

  const aiAgents = [
    {
      name: 'Busca Inteligente',
      description: 'Busca em 7+ portais imobiliários',
      icon: Search,
      color: 'bg-blue-500',
      active: true,
      route: '/aplicativo/ia-busca',
    },
    {
      name: 'Coaching SMART',
      description: 'Acompanhamento de metas',
      icon: Target,
      color: 'bg-purple-500',
      active: true,
      route: '/ia-coaching',    },
    {
      name: 'Gamificação',
      description: 'Rankings e conquistas',
      icon: Trophy,
      color: 'bg-yellow-500',
      active: true,
      route: '/aplicativo/ia-gamificacao',
    },
    {
      name: 'Anúncios',
      description: 'Otimização de marketing',
      icon: TrendingUp,
      color: 'bg-green-500',
      active: true,
      route: '/ia-anuncios-idealista',    },
    {
      name: 'Legal',
      description: 'Análise de contratos',
      icon: FileText,
      color: 'bg-red-500',
      active: true,
      route: '/aplicativo/assistente-juridico',
    },
    {
      name: 'Leads',
      description: 'Qualificação automática',
      icon: Users,
      color: 'bg-indigo-500',
      active: true,
      route: '/aplicativo/ia-leads-comissoes',
    },
    {
      name: 'Agenda IA',
      description: 'Tracking e Pomodoro',
      icon: Calendar,
      color: 'bg-pink-500',
      active: true,
      route: '/aplicativo/ia-orquestradora',
    },
  ]

  const handleCardClick = (route: string) => {
    router.push(route)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Dashboard ImoAgent</h1>
          <p className="text-muted-foreground">
            Plataforma completa de gestão imobiliária com 7 agentes de IA
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Agents */}
        <div className="animate-slide-up">
          <h2 className="text-2xl font-bold mb-4">Agentes de IA Ativos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {aiAgents.map((agent, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleCardClick(agent.route)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl ${agent.color} flex items-center justify-center mb-4`}>
                    <agent.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${agent.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm text-muted-foreground">
                      {agent.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às funcionalidades principais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center p-4 rounded-xl hover:bg-muted transition-colors">
                <Search className="w-6 h-6 mb-2 text-primary" />
                <span className="text-sm font-medium">Buscar Imóveis</span>
              </button>
              <button className="flex flex-col items-center p-4 rounded-xl hover:bg-muted transition-colors">
                <Users className="w-6 h-6 mb-2 text-primary" />
                <span className="text-sm font-medium">Novo Lead</span>
              </button>
              <button className="flex flex-col items-center p-4 rounded-xl hover:bg-muted transition-colors">
                <Calendar className="w-6 h-6 mb-2 text-primary" />
                <span className="text-sm font-medium">Agendar</span>
              </button>
              <button className="flex flex-col items-center p-4 rounded-xl hover:bg-muted transition-colors">
                <Target className="w-6 h-6 mb-2 text-primary" />
                <span className="text-sm font-medium">Metas SMART</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="grid md:grid-cols-2 gap-4 animate-slide-up">
          <Card>
            <CardHeader>
              <CardTitle>Recursos Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-sm">Busca em 7+ portais simultâneos</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-sm">7 Agentes de IA especializados</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-sm">Sistema de gamificação completo</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-sm">Scanner de documentos</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-sm">Calculadora de comissões</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-sm">Integração com Stripe</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database & Edge Functions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-sm">15+ tabelas no Supabase</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-sm">7 Edge Functions serverless</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-sm">Row Level Security (RLS)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-sm">Real-time subscriptions</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-sm">Autenticação segura</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-sm">Storage para documentos</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
