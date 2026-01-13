import type { ReactNode } from 'react'

type AgentPageProps = {
  title: string
  subtitle?: string
  children?: ReactNode
}

export function AgentPage({ title, subtitle, children }: AgentPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-pink-100/70 p-8 backdrop-blur-sm transition-all">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          {subtitle ? <p className="text-gray-700">{subtitle}</p> : null}
          <p className="text-sm text-purple-700 mt-4">Interface do agente em desenvolvimento...</p>
          {children ? <div className="mt-6">{children}</div> : null}
        </div>
      </div>
    </div>
  )
}
