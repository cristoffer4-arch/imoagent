'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GamificationDashboard from '@/components/games/leadcity/GamificationDashboard';
import { createClient } from '@/lib/supabase/client';

export default function LeadCityStatsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setError('Você precisa estar autenticado para ver as estatísticas');
          setLoading(false);
          return;
        }

        setUserId(user.id);
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar dados do utilizador');
        setLoading(false);
        console.error('Auth error:', err);
      }
    }

    loadUser();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-gray-600 font-medium">A carregar estatísticas...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">{error || 'Erro desconhecido'}</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors shadow-lg"
            >
              Fazer Login
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <Link
              href="/aplicativo/games/leadcity"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Voltar ao Jogo</span>
            </Link>

            {/* Title */}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LeadCity - Estatísticas
            </h1>

            {/* Spacer for centering title */}
            <div className="w-[160px]" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-12">
        <GamificationDashboard userId={userId} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-6 mb-3">
            <Link
              href="/aplicativo/games/leadcity"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              🎮 Jogar
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/aplicativo/games/leadcity/stats"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              📊 Estatísticas
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/aplicativo"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              🏠 Dashboard
            </Link>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 LeadCity - Transforme vendas em diversão
          </p>
        </div>
      </footer>
    </div>
  );
}
