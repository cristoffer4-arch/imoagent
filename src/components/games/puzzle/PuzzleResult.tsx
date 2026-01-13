'use client';

import type { PuzzleConfig } from '@/types/games';
import { formatTime, calculateBonus } from '@/lib/game-utils';

type PuzzleResultProps = {
  config: PuzzleConfig;
  timeUsed: number;
  hintsUsed: number;
  onPlayAgain: () => void;
  onBack: () => void;
};

export function PuzzleResult({ config, timeUsed, hintsUsed, onPlayAgain, onBack }: PuzzleResultProps) {
  const noHints = hintsUsed === 0;
  const timeBonus = timeUsed < config.timeLimit * 0.5;
  const hintsPenalty = hintsUsed * 50;
  
  const basePoints = config.basePoints - hintsPenalty;
  const finalPoints = calculateBonus(basePoints, { noHints, timeBonus });

  const badges: string[] = [];
  if (noHints) badges.push('🎯 Sem Dicas');
  if (timeBonus) badges.push('⚡ Velocista');
  if (config.difficulty === 'expert') badges.push('👑 Mestre Expert');

  return (
    <div className="space-y-6 text-center">
      <div className="text-6xl animate-bounce">🎉</div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Parabéns!</h2>
        <p className="text-gray-600">Você completou o quebra-cabeça!</p>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Dificuldade:</span>
            <span className="font-semibold text-gray-900 capitalize">{config.difficulty}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tempo:</span>
            <span className="font-semibold text-gray-900">{formatTime(timeUsed)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Dicas usadas:</span>
            <span className="font-semibold text-gray-900">{hintsUsed}/3</span>
          </div>
        </div>

        <div className="border-t border-purple-200 pt-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pontos base:</span>
              <span className="text-gray-900">{config.basePoints}</span>
            </div>
            {hintsPenalty > 0 && (
              <div className="flex items-center justify-between text-red-600">
                <span>Penalidade dicas:</span>
                <span>-{hintsPenalty}</span>
              </div>
            )}
            {noHints && (
              <div className="flex items-center justify-between text-green-600">
                <span>Bônus sem dicas:</span>
                <span>+50%</span>
              </div>
            )}
            {timeBonus && (
              <div className="flex items-center justify-between text-green-600">
                <span>Bônus tempo:</span>
                <span>+100%</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-purple-600">{finalPoints} pts</span>
            </div>
          </div>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="rounded-2xl bg-yellow-50 p-4">
          <p className="text-sm font-semibold text-yellow-900 mb-2">🏆 Conquistas:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {badges.map((badge, i) => (
              <div
                key={i}
                className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium"
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <button
          onClick={onBack}
          className="rounded-full bg-white px-6 py-3 text-gray-700 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 ring-1 ring-gray-200"
        >
          Voltar
        </button>
        <button
          onClick={onPlayAgain}
          className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          Jogar Novamente
        </button>
      </div>
    </div>
  );
}
