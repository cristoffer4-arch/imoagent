import Link from 'next/link';
import { LeadCityGame } from '@/components/games/leadcity/LeadCityGame';

// Disable static generation for this page since it requires browser APIs
export const dynamic = 'force-dynamic';

export default function LeadCityPage() {
  return (
    <div>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Link
            href="/aplicativo/ia-gamificacao"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Gamificação
          </Link>
        </div>
      </div>
      
      <LeadCityGame />
    </div>
  );
}
