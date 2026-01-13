'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BoardGame } from '@/components/games/board/BoardGame';
import type { BoardPlayer } from '@/types/games';
import { saveGameScore, addPoints, unlockBadge } from '@/lib/game-utils';

type GameState = 'start' | 'playing' | 'result';

export default function BoardGamePage() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [winner, setWinner] = useState<BoardPlayer | null>(null);
  const [turns, setTurns] = useState(0);

  const handleGameEnd = (winningPlayer: BoardPlayer, totalTurns: number) => {
    setWinner(winningPlayer);
    setTurns(totalTurns);
    setGameState('result');

    if (winningPlayer.id === 'player') {
      // Player won
      const points = 200;
      
      saveGameScore({
        gameId: 'board',
        score: points,
        timestamp: new Date(),
        metadata: { turns: totalTurns, properties: winningPlayer.properties.length },
      });

      addPoints(points);

      // Badges
      if (winningPlayer.properties.length >= 10) {
        unlockBadge({
          id: 'board-investor',
          name: 'Investidor',
          description: 'Possuiu 10 propriedades em uma partida',
          icon: '🏢',
        });
      }

      unlockBadge({
        id: 'board-winner',
        name: 'Magnata Imobiliário',
        description: 'Venceu uma partida do tabuleiro',
        icon: '👑',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
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

        <div className="rounded-3xl bg-white/80 shadow-lg ring-1 ring-pink-100/70 p-8 backdrop-blur-sm">
          {gameState === 'start' && (
            <div className="space-y-6 text-center">
              <div className="text-6xl">🎲</div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Imobiliária Portugal</h2>
                <p className="text-gray-600">Jogo de tabuleiro estratégico inspirado no mercado imobiliário português</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="rounded-xl bg-purple-50 p-4">
                  <div className="text-3xl mb-2">🏘️</div>
                  <div className="font-semibold text-gray-900 mb-1">40 Propriedades</div>
                  <div className="text-sm text-gray-600">Cidades reais de Portugal com preços de mercado</div>
                </div>
                <div className="rounded-xl bg-blue-50 p-4">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="font-semibold text-gray-900 mb-1">€500.000 Inicial</div>
                  <div className="text-sm text-gray-600">Compre propriedades e cobre comissões</div>
                </div>
                <div className="rounded-xl bg-green-50 p-4">
                  <div className="text-3xl mb-2">🍀</div>
                  <div className="font-semibold text-gray-900 mb-1">Cartas Especiais</div>
                  <div className="text-sm text-gray-600">Sorte, Revés e Coaching IA</div>
                </div>
                <div className="rounded-xl bg-yellow-50 p-4">
                  <div className="text-3xl mb-2">🤖</div>
                  <div className="font-semibold text-gray-900 mb-1">vs IA</div>
                  <div className="text-sm text-gray-600">Jogue contra a inteligência artificial</div>
                </div>
              </div>

              <div className="rounded-xl bg-pink-50 p-4 text-left">
                <p className="font-semibold text-pink-900 mb-2">📋 Como Jogar:</p>
                <ul className="space-y-1 text-sm text-pink-800">
                  <li>• Role os dados e mova seu peão</li>
                  <li>• Compre propriedades quando parar nelas</li>
                  <li>• Cobre comissão quando adversário parar em sua propriedade</li>
                  <li>• Cartas podem ajudar ou atrapalhar seu progresso</li>
                  <li>• Vence quem tiver mais patrimônio ao final ou quebrar o oponente</li>
                </ul>
              </div>

              <button
                onClick={() => setGameState('playing')}
                className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-4 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Começar Partida
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <BoardGame onGameEnd={handleGameEnd} />
          )}

          {gameState === 'result' && winner && (
            <div className="space-y-6 text-center">
              <div className="text-6xl">{winner.id === 'player' ? '🏆' : '😔'}</div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {winner.id === 'player' ? 'Vitória!' : 'Derrota'}
                </h2>
                <p className="text-gray-600">
                  {winner.id === 'player' 
                    ? 'Parabéns! Você venceu a partida!' 
                    : 'A IA venceu desta vez. Tente novamente!'}
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">€{winner.money.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Dinheiro Final</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-600">{winner.properties.length}</div>
                    <div className="text-sm text-gray-600">Propriedades</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{turns}</div>
                    <div className="text-sm text-gray-600">Turnos</div>
                  </div>
                </div>

                {winner.id === 'player' && (
                  <div className="pt-4 border-t border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">+200 pontos</div>
                    <div className="text-sm text-gray-600">Pontos de Gamificação</div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setGameState('start')}
                  className="rounded-full bg-white px-6 py-3 text-gray-700 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 ring-1 ring-gray-200"
                >
                  Voltar
                </button>
                <button
                  onClick={() => {
                    setGameState('playing');
                    setWinner(null);
                    setTurns(0);
                  }}
                  className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Jogar Novamente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
