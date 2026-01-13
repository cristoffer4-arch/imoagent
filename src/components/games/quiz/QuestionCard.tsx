'use client';

import { useState, useEffect } from 'react';
import type { QuizQuestion, QuizHelp } from '@/types/games';

type QuestionCardProps = {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answerIndex: number) => void;
  timeLeft: number;
  availableHelps: QuizHelp[];
  onUseHelp: (help: QuizHelp) => void;
};

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  timeLeft,
  availableHelps,
  onUseHelp,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setSelectedAnswer(null);
    setEliminated([]);
    setRevealed(false);
  }, [question]);

  const handleAnswer = (index: number) => {
    if (revealed || eliminated.includes(index)) return;
    setSelectedAnswer(index);
    setRevealed(true);
    
    setTimeout(() => {
      onAnswer(index);
    }, 1500);
  };

  const handleFiftyFifty = () => {
    const wrongAnswers = question.options
      .map((_, i) => i)
      .filter(i => i !== question.correctAnswer);
    
    const toEliminate = wrongAnswers.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminated(toEliminate);
    onUseHelp('50-50');
  };

  const handleExtraTime = () => {
    onUseHelp('extra-time');
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      legislacao: 'from-blue-500 to-blue-600',
      mercado: 'from-green-500 to-green-600',
      vendas: 'from-purple-500 to-purple-600',
      tecnicas: 'from-orange-500 to-orange-600',
    };
    return colors[category as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      legislacao: '⚖️',
      mercado: '📈',
      vendas: '💼',
      tecnicas: '🎯',
    };
    return icons[category as keyof typeof icons] || '❓';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-2xl`}>{getCategoryIcon(question.category)}</span>
          <div>
            <div className="text-sm text-gray-500">
              Pergunta {questionNumber} de {totalQuestions}
            </div>
            <div className="text-xs text-gray-400 capitalize">{question.category}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <h3 className="text-xl font-bold text-gray-900">{question.question}</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = index === question.correctAnswer;
          const isWrong = revealed && isSelected && !isCorrect;
          const showCorrect = revealed && isCorrect;
          const isEliminated = eliminated.includes(index);

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={revealed || isEliminated}
              className={`
                p-4 rounded-xl text-left font-medium transition-all
                ${isEliminated ? 'opacity-30 cursor-not-allowed' : ''}
                ${!revealed && !isEliminated ? 'bg-white hover:bg-purple-50 ring-1 ring-purple-100 hover:ring-purple-200 hover:shadow-md' : ''}
                ${showCorrect ? 'bg-gradient-to-r from-green-500 to-green-600 text-white ring-2 ring-green-400' : ''}
                ${isWrong ? 'bg-gradient-to-r from-red-500 to-red-600 text-white ring-2 ring-red-400' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {showCorrect && <span className="text-2xl">✓</span>}
                {isWrong && <span className="text-2xl">✗</span>}
              </div>
            </button>
          );
        })}
      </div>

      {revealed && question.explanation && (
        <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900 animate-fade-in">
          <p className="font-semibold mb-1">💡 Explicação:</p>
          <p>{question.explanation}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleFiftyFifty}
          disabled={!availableHelps.includes('50-50') || revealed}
          className="flex-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          🔥 50/50
        </button>
        <button
          onClick={handleExtraTime}
          disabled={!availableHelps.includes('extra-time') || revealed}
          className="flex-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 px-4 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          🕒 +10s
        </button>
      </div>
    </div>
  );
}
