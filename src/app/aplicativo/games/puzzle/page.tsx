'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PuzzleSelector } from '@/components/games/puzzle/PuzzleSelector';
import { PuzzleBoard } from '@/components/games/puzzle/PuzzleBoard';
import { PuzzleResult } from '@/components/games/puzzle/PuzzleResult';
import type { PuzzleConfig } from '@/types/games';
import { saveGameScore, addPoints, updateStreak, unlockBadge } from '@/lib/game-utils';

type GameState = 'select' | 'playing' | 'result';

export default function PuzzleGamePage() {
  const [gameState, setGameState] = useState<GameState>('select');
  const [config, setConfig] = useState<PuzzleConfig | null>(null);
  const [timeUsed, setTimeUsed] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  const handleSelect = (selectedConfig: PuzzleConfig) => {
    setConfig(selectedConfig);
    setGameState('playing');
  };

  const handleComplete = (time: number, hints: number) => {
    setTimeUsed(time);
    setHintsUsed(hints);
    setGameState('result');

    if (config) {
      // Calculate final points
      const hintsPenalty = hints * 50;
      const basePoints = config.basePoints - hintsPenalty;
      const noHints = hints === 0;
      const timeBonus = time < config.timeLimit * 0.5;
      
      let finalPoints = basePoints;
      if (noHints) finalPoints *= 1.5;
      if (timeBonus) finalPoints *= 2;
      finalPoints = Math.round(finalPoints);

      // Save score
      saveGameScore({
        gameId: 'puzzle',
        score: finalPoints,
        timestamp: new Date(),
        difficulty: config.difficulty,
        metadata: { timeUsed: time, hintsUsed: hints },
      });

      // Add points
      addPoints(finalPoints);

      // Update streak
      const streak = updateStreak('puzzle');
      
      // Check for badges
      if (streak >= 5) {
        unlockBadge({
          id: 'puzzle-master',
          name: 'Mestre do Puzzle',
          description: 'Completou puzzles por 5 dias consecutivos',
          icon: '🎯',
        });
      }

      if (config.difficulty === 'expert' && noHints) {
        unlockBadge({
          id: 'puzzle-expert',
          name: 'Expert Sem Dicas',
          description: 'Completou puzzle expert sem usar dicas',
          icon: '👑',
        });
      }
    }
  };

  const handlePlayAgain = () => {
    setGameState('select');
    setConfig(null);
    setTimeUsed(0);
    setHintsUsed(0);
  };

  const handleBack = () => {
    setGameState('select');
    setConfig(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
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
          {gameState === 'select' && <PuzzleSelector onSelect={handleSelect} />}
          
          {gameState === 'playing' && config && (
            <PuzzleBoard
              config={config}
              onComplete={handleComplete}
              onQuit={handleBack}
            />
          )}
          
          {gameState === 'result' && config && (
            <PuzzleResult
              config={config}
              timeUsed={timeUsed}
              hintsUsed={hintsUsed}
              onPlayAgain={handlePlayAgain}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}
