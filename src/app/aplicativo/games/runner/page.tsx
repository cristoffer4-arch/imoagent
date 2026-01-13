'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RunnerGame } from '@/components/games/runner/RunnerGame';
import { saveGameScore, addPoints, unlockBadge, getHighScore } from '@/lib/game-utils';

type GameState = 'start' | 'playing' | 'result';

export default function RunnerGamePage() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [finalScore, setFinalScore] = useState(0);
  const [finalDistance, setFinalDistance] = useState(0);
  const highScore = getHighScore('runner');

  const handleGameOver = (score: number, distance: number) => {
    setFinalScore(score);
    setFinalDistance(distance);
    setGameState('result');

    // Calculate points for gamification
    let gamificationPoints = 0;
    if (score < 500) gamificationPoints = 10;
    else if (score < 1000) gamificationPoints = 30;
    else if (score < 2000) gamificationPoints = 70;
    else gamificationPoints = 150;

    // Save score
    saveGameScore({
      gameId: 'runner',
      score: score,
      timestamp: new Date(),
      metadata: { distance },
    });

    // Add points
    addPoints(gamificationPoints);

    // Check for badges
    const totalScores = JSON.parse(localStorage.getItem('imoagent_game_scores') || '[]');
    const runnerScores = totalScores.filter((s: any) => s.gameId === 'runner');
    const totalDistance = runnerScores.reduce((acc: number, s: any) => acc + (s.metadata?.distance || 0), 0);

    if (totalDistance >= 10000) {
      unlockBadge({
        id: 'runner-marathon',
        name: 'Maratonista Virtual',
        description: 'Correu 10km acumulados',
        icon: '🏃',
      });
    }

    if (score >= 1000) {
      unlockBadge({
        id: 'runner-hunter',
        name: 'Caçador Nato',
        description: 'Alcançou 1000 pontos em uma corrida',
        icon: '🎯',
      });
    }

    if (score > highScore) {
      unlockBadge({
        id: 'runner-record',
        name: 'Novo Recorde',
        description: 'Bateu seu recorde pessoal',
        icon: '🏆',
      });
    }
  };

  const handlePlayAgain = () => {
    setGameState('playing');
    setFinalScore(0);
    setFinalDistance(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-purple-50 p-6">
      <div className="max-w-5xl mx-auto">
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
              <div className="text-6xl">🎮</div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Caça Leads</h2>
                <p className="text-gray-600">Corra pela cidade coletando leads e evitando obstáculos!</p>
              </div>

              {highScore > 0 && (
                <div className="rounded-2xl bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-900 font-semibold">🏆 Seu Recorde</p>
                  <p className="text-3xl font-bold text-yellow-700">{highScore} pontos</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="rounded-xl bg-green-50 p-4">
                  <div className="text-3xl mb-2">🟢</div>
                  <div className="font-semibold text-gray-900 mb-1">Lead Qualificado</div>
                  <div className="text-sm text-gray-600">+10 pontos cada</div>
                </div>
                <div className="rounded-xl bg-blue-50 p-4">
                  <div className="text-3xl mb-2">🔵</div>
                  <div className="font-semibold text-gray-900 mb-1">Lead Morno</div>
                  <div className="text-sm text-gray-600">+5 pontos cada</div>
                </div>
                <div className="rounded-xl bg-yellow-50 p-4">
                  <div className="text-3xl mb-2">📄</div>
                  <div className="font-semibold text-gray-900 mb-1">Contrato</div>
                  <div className="text-sm text-gray-600">+50 pontos (raro)</div>
                </div>
                <div className="rounded-xl bg-orange-50 p-4">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="font-semibold text-gray-900 mb-1">Power-up</div>
                  <div className="text-sm text-gray-600">2x pontos por 3s</div>
                </div>
              </div>

              <div className="rounded-xl bg-red-50 p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🚧</div>
                  <div>
                    <div className="font-semibold text-red-900">Cuidado com os Obstáculos!</div>
                    <div className="text-sm text-red-700">Colidir com obstáculos termina o jogo</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setGameState('playing')}
                className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-4 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Começar Jogo
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <RunnerGame onGameOver={handleGameOver} />
          )}

          {gameState === 'result' && (
            <div className="space-y-6 text-center">
              <div className="text-6xl">🏁</div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Game Over!</h2>
                <p className="text-gray-600">Confira seu desempenho</p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-purple-600">{finalScore}</div>
                    <div className="text-sm text-gray-600">Pontos</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-pink-600">{finalDistance}m</div>
                    <div className="text-sm text-gray-600">Distância</div>
                  </div>
                </div>

                {finalScore > highScore && (
                  <div className="pt-4 border-t border-purple-200">
                    <div className="text-yellow-600 font-bold text-lg">🏆 Novo Recorde!</div>
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
                  onClick={handlePlayAgain}
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
