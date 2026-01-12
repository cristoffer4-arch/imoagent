import { Suspense } from 'react'
import Dashboard from '@/components/dashboard/dashboard'

function DashboardFallback() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <Dashboard />
    </Suspense>
  )
}

