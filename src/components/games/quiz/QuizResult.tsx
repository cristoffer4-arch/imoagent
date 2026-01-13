'use client';

type QuizResultProps = {
  correctAnswers: number;
  totalQuestions: number;
  points: number;
  timeTaken: number;
  onPlayAgain: () => void;
  onBack: () => void;
};

export function QuizResult({
  correctAnswers,
  totalQuestions,
  points,
  timeTaken,
  onPlayAgain,
  onBack,
}: QuizResultProps) {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  
  const getGrade = () => {
    if (percentage === 100) return { emoji: '🏆', text: 'Perfeito!', color: 'text-yellow-600' };
    if (percentage >= 90) return { emoji: '🌟', text: 'Excelente!', color: 'text-green-600' };
    if (percentage >= 70) return { emoji: '👍', text: 'Muito Bom!', color: 'text-blue-600' };
    if (percentage >= 50) return { emoji: '👌', text: 'Bom!', color: 'text-purple-600' };
    return { emoji: '💪', text: 'Continue Praticando!', color: 'text-gray-600' };
  };

  const grade = getGrade();

  const achievements: string[] = [];
  if (correctAnswers === totalQuestions) achievements.push('🎯 Pontuação Perfeita');
  if (timeTaken < 90) achievements.push('⚡ Velocista');
  if (percentage >= 90) achievements.push('🧠 Cérebro Imobiliário');

  return (
    <div className="space-y-6 text-center">
      <div className="text-6xl animate-bounce">{grade.emoji}</div>
      
      <div>
        <h2 className={`text-3xl font-bold mb-2 ${grade.color}`}>{grade.text}</h2>
        <p className="text-gray-600">Quiz Diário Completado</p>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 space-y-4">
        <div className="text-center">
          <div className="text-5xl font-bold text-purple-600 mb-2">
            {correctAnswers}/{totalQuestions}
          </div>
          <div className="text-sm text-gray-600">Respostas Corretas</div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-200">
          <div>
            <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
            <div className="text-xs text-gray-500">Acerto</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{timeTaken}s</div>
            <div className="text-xs text-gray-500">Tempo Total</div>
          </div>
        </div>

        <div className="pt-4 border-t border-purple-200">
          <div className="text-3xl font-bold text-purple-600 mb-1">{points} pts</div>
          <div className="text-sm text-gray-600">Pontos Ganhos</div>
        </div>
      </div>

      {achievements.length > 0 && (
        <div className="rounded-2xl bg-yellow-50 p-4">
          <p className="text-sm font-semibold text-yellow-900 mb-2">🏆 Conquistas:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {achievements.map((achievement, i) => (
              <div
                key={i}
                className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium"
              >
                {achievement}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">💡 Dica:</p>
        <p>Volte amanhã para um novo quiz diário e mantenha sua sequência!</p>
      </div>

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
          Novo Quiz
        </button>
      </div>
    </div>
  );
}
