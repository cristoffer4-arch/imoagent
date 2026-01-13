'use client';

import { useState, useEffect, useCallback } from 'react';
import type { QuizQuestion, QuizHelp } from '@/types/games';
import { QuestionCard } from './QuestionCard';

type QuizDailyProps = {
  questions: QuizQuestion[];
  onComplete: (correctAnswers: number, timeTaken: number) => void;
};

export function QuizDaily({ questions, onComplete }: QuizDailyProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [totalTime, setTotalTime] = useState(0);
  const [availableHelps, setAvailableHelps] = useState<QuizHelp[]>(['50-50', 'extra-time']);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleAnswer(-1); // Time's up
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
      setTotalTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswer = useCallback((answerIndex: number) => {
    const isCorrect = answerIndex === questions[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(15);
    } else {
      onComplete(correctAnswers + (isCorrect ? 1 : 0), totalTime + 1);
    }
  }, [currentQuestion, questions, correctAnswers, totalTime, onComplete]);

  const handleUseHelp = useCallback((help: QuizHelp) => {
    if (help === 'extra-time') {
      setTimeLeft(prev => prev + 10);
    }
    setAvailableHelps(prev => prev.filter(h => h !== help));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="flex gap-2">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-8 h-2 rounded-full transition-all ${
                i < currentQuestion
                  ? 'bg-green-500'
                  : i === currentQuestion
                  ? 'bg-purple-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <QuestionCard
        question={questions[currentQuestion]}
        questionNumber={currentQuestion + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        timeLeft={timeLeft}
        availableHelps={availableHelps}
        onUseHelp={handleUseHelp}
      />
    </div>
  );
}
