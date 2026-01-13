'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QuizDaily } from '@/components/games/quiz/QuizDaily';
import { QuizResult } from '@/components/games/quiz/QuizResult';
import { getRandomQuestions } from '@/lib/quiz-data';
import { saveGameScore, addPoints, updateStreak, unlockBadge } from '@/lib/game-utils';
import type { QuizQuestion } from '@/types/games';

type GameState = 'start' | 'playing' | 'result';

export default function QuizGamePage() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [points, setPoints] = useState(0);

  const handleStart = () => {
    const newQuestions = getRandomQuestions(10);
    setQuestions(newQuestions);
    setGameState('playing');
  };

  const handleComplete = (correct: number, time: number) => {
    setCorrectAnswers(correct);
    setTimeTaken(time);
    
    // Calculate points
    let earnedPoints = 0;
    if (correct <= 3) earnedPoints = 10;
    else if (correct <= 6) earnedPoints = 30;
    else if (correct <= 9) earnedPoints = 70;
    else earnedPoints = 150;

    // Bonus for speed
    if (time < 90) {
      earnedPoints = Math.round(earnedPoints * 1.2);
    }

    setPoints(earnedPoints);
    setGameState('result');

    // Save score
    saveGameScore({
      gameId: 'quiz',
      score: earnedPoints,
      timestamp: new Date(),
      metadata: { correctAnswers: correct, totalQuestions: 10, timeTaken: time },
    });

    // Add points
    addPoints(earnedPoints);

    // Update streak
    const streak = updateStreak('quiz');
    
    // Check for badges
    if (streak >= 7) {
      unlockBadge({
        id: 'quiz-week-streak',
        name: 'Dedicação Semanal',
        description: 'Completou quiz por 7 dias consecutivos',
        icon: '🔥',
      });
    }

    if (streak >= 30) {
      unlockBadge({
        id: 'quiz-month-streak',
        name: 'Dedicação Inabalável',
        description: 'Completou quiz por 30 dias consecutivos',
        icon: '💎',
      });
    }

    if (correct === 10) {
      unlockBadge({
        id: 'quiz-perfect',
        name: 'Cérebro Imobiliário',
        description: 'Pontuação perfeita no quiz',
        icon: '🧠',
      });
    }
  };

  const handlePlayAgain = () => {
    setGameState('start');
    setCorrectAnswers(0);
    setTimeTaken(0);
    setPoints(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-purple-50 p-6">
      <div className="max-w-3xl mx-auto">
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
              <div className="text-6xl">🧠</div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Imobiliário IQ</h2>
                <p className="text-gray-600">Teste seus conhecimentos sobre o mercado imobiliário português</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="rounded-xl bg-purple-50 p-4">
                  <div className="text-3xl mb-2">📝</div>
                  <div className="font-semibold text-gray-900 mb-1">10 Perguntas</div>
                  <div className="text-sm text-gray-600">Sobre legislação, mercado, vendas e técnicas</div>
                </div>
                <div className="rounded-xl bg-pink-50 p-4">
                  <div className="text-3xl mb-2">⏱️</div>
                  <div className="font-semibold text-gray-900 mb-1">15s por Pergunta</div>
                  <div className="text-sm text-gray-600">Responda rápido para ganhar mais pontos</div>
                </div>
                <div className="rounded-xl bg-yellow-50 p-4">
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="font-semibold text-gray-900 mb-1">Ajudas</div>
                  <div className="text-sm text-gray-600">50/50 e +10 segundos</div>
                </div>
                <div className="rounded-xl bg-blue-50 p-4">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="font-semibold text-gray-900 mb-1">Até 150 Pontos</div>
                  <div className="text-sm text-gray-600">10/10 corretas + bônus</div>
                </div>
              </div>

              <button
                onClick={handleStart}
                className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-4 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Começar Quiz
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <QuizDaily questions={questions} onComplete={handleComplete} />
          )}

          {gameState === 'result' && (
            <QuizResult
              correctAnswers={correctAnswers}
              totalQuestions={10}
              points={points}
              timeTaken={timeTaken}
              onPlayAgain={handlePlayAgain}
              onBack={() => setGameState('start')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
