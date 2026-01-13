'use client';

import type { Difficulty, PuzzleConfig } from '@/types/games';

type PuzzleSelectorProps = {
  onSelect: (config: PuzzleConfig) => void;
};

const PUZZLE_CONFIGS: Record<Difficulty, PuzzleConfig> = {
  facil: { difficulty: 'facil', pieces: 9, timeLimit: 120, basePoints: 10 },
  medio: { difficulty: 'medio', pieces: 25, timeLimit: 300, basePoints: 50 },
  dificil: { difficulty: 'dificil', pieces: 64, timeLimit: 480, basePoints: 150 },
  expert: { difficulty: 'expert', pieces: 100, timeLimit: 600, basePoints: 300 },
};

export function PuzzleSelector({ onSelect }: PuzzleSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🧩 Quebra-Cabeça Imobiliário</h2>
        <p className="text-gray-600">Escolha o nível de dificuldade</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(PUZZLE_CONFIGS).map(([key, config]) => (
          <button
            key={key}
            onClick={() => onSelect(config)}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-purple-50 p-6 shadow-lg ring-1 ring-purple-100 transition-all hover:shadow-xl hover:scale-[1.02] hover:ring-purple-200 active:scale-[0.98]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 capitalize">{config.difficulty}</h3>
                <div className="text-2xl">
                  {config.difficulty === 'facil' && '⭐'}
                  {config.difficulty === 'medio' && '⭐⭐'}
                  {config.difficulty === 'dificil' && '⭐⭐⭐'}
                  {config.difficulty === 'expert' && '⭐⭐⭐⭐'}
                </div>
              </div>
              
              <div className="space-y-1 text-left text-sm text-gray-600">
                <p>🧩 {config.pieces} peças</p>
                <p>⏱️ {Math.floor(config.timeLimit / 60)} minutos</p>
                <p>🏆 {config.basePoints} pontos base</p>
              </div>
              
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 text-purple-600 font-semibold group-hover:text-purple-700">
                  Jogar
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="rounded-2xl bg-purple-50 p-4 text-sm text-purple-900">
        <p className="font-semibold mb-2">💡 Bônus:</p>
        <ul className="space-y-1 text-purple-700">
          <li>• Completar sem dicas: +50% pontos</li>
          <li>• Terminar em menos de 50% do tempo: +100% pontos</li>
          <li>• Streak de 5 dias seguidos: Badge &quot;Mestre do Puzzle&quot;</li>
        </ul>
      </div>
    </div>
  );
}
