"use client";

import { useState, useEffect } from 'react';
import { getDISCProfile, upsertDISCProfile } from '@/lib/supabase-coaching';

const DISC_QUESTIONS = [
  { id: 1, text: 'Gosto de assumir o controle e tomar decisões rapidamente', dimension: 'D' },
  { id: 2, text: 'Prefiro trabalhar com pessoas e socializar', dimension: 'I' },
  { id: 3, text: 'Valorizo estabilidade e ambiente previsível', dimension: 'S' },
  { id: 4, text: 'Gosto de análise detalhada e precisão', dimension: 'C' },
  { id: 5, text: 'Sou direto e competitivo', dimension: 'D' },
  { id: 6, text: 'Sou entusiasta e otimista', dimension: 'I' },
  { id: 7, text: 'Sou paciente e bom ouvinte', dimension: 'S' },
  { id: 8, text: 'Sou cauteloso e metódico', dimension: 'C' },
  { id: 9, text: 'Gosto de desafios e resultados rápidos', dimension: 'D' },
  { id: 10, text: 'Gosto de inspirar e motivar outros', dimension: 'I' },
  { id: 11, text: 'Gosto de cooperar e trabalhar em equipe', dimension: 'S' },
  { id: 12, text: 'Gosto de seguir regras e padrões', dimension: 'C' },
  { id: 13, text: 'Sou assertivo e determinado', dimension: 'D' },
  { id: 14, text: 'Sou expressivo e comunicativo', dimension: 'I' },
  { id: 15, text: 'Sou leal e confiável', dimension: 'S' },
  { id: 16, text: 'Sou diplomático e objetivo', dimension: 'C' },
];

const DISC_PROFILES = {
  D: {
    name: 'Dominância',
    color: 'red',
    description: 'Focado em resultados, direto, competitivo',
    strengths: ['Tomada de decisões rápidas', 'Orientado para resultados', 'Assume desafios'],
    weaknesses: ['Pode ser impaciente', 'Menos sensível', 'Pode intimidar'],
    tips: ['Use comunicação direta', 'Foque em resultados', 'Seja eficiente'],
  },
  I: {
    name: 'Influência',
    color: 'yellow',
    description: 'Sociável, entusiasta, persuasivo',
    strengths: ['Excelente comunicador', 'Motivador', 'Otimista'],
    weaknesses: ['Pode ser desorganizado', 'Evita conflitos', 'Impulsivo'],
    tips: ['Seja caloroso e amigável', 'Use histórias', 'Mantenha entusiasmo'],
  },
  S: {
    name: 'Estabilidade',
    color: 'green',
    description: 'Paciente, leal, apoiador',
    strengths: ['Bom ouvinte', 'Confiável', 'Trabalhador em equipe'],
    weaknesses: ['Resiste a mudanças', 'Evita confrontos', 'Indeciso'],
    tips: ['Seja paciente e apoiador', 'Explique mudanças', 'Mostre sinceridade'],
  },
  C: {
    name: 'Conformidade',
    color: 'blue',
    description: 'Analítico, preciso, sistemático',
    strengths: ['Atenção aos detalhes', 'Organizado', 'Pensamento lógico'],
    weaknesses: ['Pode ser crítico', 'Lento nas decisões', 'Perfeccionista'],
    tips: ['Forneça dados e fatos', 'Seja preciso', 'Dê tempo para analisar'],
  },
};

const PNL_SCRIPTS = {
  D: [
    'Rapport: Mantenha postura confiante e assertiva',
    'Linguagem: Use verbos de ação - "decidir", "conquistar", "vencer"',
    'Foco: Resultados concretos e prazos',
    'Evite: Detalhes excessivos ou socialização prolongada',
  ],
  I: [
    'Rapport: Sorria, seja caloroso e entusiasta',
    'Linguagem: Use palavras emocionais - "imagina", "sonha", "sente"',
    'Foco: Benefícios pessoais e reconhecimento',
    'Evite: Excesso de dados técnicos ou formalidade',
  ],
  S: [
    'Rapport: Seja paciente, demonstre sinceridade',
    'Linguagem: Use tom calmo - "juntos", "apoio", "segurança"',
    'Foco: Relacionamentos e estabilidade',
    'Evite: Pressão ou mudanças abruptas',
  ],
  C: [
    'Rapport: Seja profissional e organizado',
    'Linguagem: Use termos precisos - "análise", "dados", "qualidade"',
    'Foco: Informações detalhadas e lógica',
    'Evite: Generalidades ou promessas vagas',
  ],
};

export function DISCAnalysis({ userId }: { userId: string }) {
  const [step, setStep] = useState<'intro' | 'quiz' | 'results'>('intro');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function loadProfile() {
    try {
      const data = await getDISCProfile(userId);
      if (data) {
        setProfile(data);
        setStep('results');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  function handleAnswer(questionId: number, value: number) {
    setAnswers({ ...answers, [questionId]: value });
  }

  async function calculateProfile() {
    setLoading(true);
    
    const scores = { D: 0, I: 0, S: 0, C: 0 };
    
    DISC_QUESTIONS.forEach((q) => {
      const answer = answers[q.id] || 0;
      scores[q.dimension as keyof typeof scores] += answer;
    });

    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const percentages = {
      dominance: Math.round((scores.D / total) * 100),
      influence: Math.round((scores.I / total) * 100),
      steadiness: Math.round((scores.S / total) * 100),
      conscientiousness: Math.round((scores.C / total) * 100),
    };

    const primaryStyle = Object.entries(scores).reduce((a, b) =>
      scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
    )[0] as 'D' | 'I' | 'S' | 'C';

    const communicationTips = PNL_SCRIPTS[primaryStyle];

    try {
      const savedProfile = await upsertDISCProfile({
        user_id: userId,
        ...percentages,
        primary_style: primaryStyle,
        communication_tips: communicationTips,
      });
      setProfile(savedProfile);
      setStep('results');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'intro') {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-8 text-center">
          <h3 className="text-2xl font-bold text-purple-100 mb-4">
            Descubra seu Perfil DISC
          </h3>
          <p className="text-slate-300 mb-6">
            Responda 16 perguntas rápidas para entender seu estilo comportamental e receber
            scripts de comunicação PNL personalizados para melhorar suas vendas.
          </p>
          <button
            onClick={() => setStep('quiz')}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold text-lg hover:shadow-lg transition"
          >
            Começar Análise
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(DISC_PROFILES).map(([key, data]) => (
            <div
              key={key}
              className={`rounded-2xl bg-${data.color}-500/10 border border-${data.color}-500/30 p-4`}
            >
              <div className="text-3xl font-bold text-center mb-2">{key}</div>
              <div className={`text-sm font-semibold text-${data.color}-300 text-center mb-2`}>
                {data.name}
              </div>
              <p className="text-xs text-slate-400 text-center">{data.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'quiz') {
    const progress = (Object.keys(answers).length / DISC_QUESTIONS.length) * 100;

    return (
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">Progresso</span>
            <span className="text-sm font-semibold text-slate-300">
              {Object.keys(answers).length} / {DISC_QUESTIONS.length}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {DISC_QUESTIONS.map((question) => (
            <div
              key={question.id}
              className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6"
            >
              <p className="text-slate-100 font-medium mb-4">
                {question.id}. {question.text}
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleAnswer(question.id, value)}
                    className={`flex-1 py-2 rounded-lg font-semibold transition ${
                      answers[question.id] === value
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>Discordo</span>
                <span>Concordo</span>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {Object.keys(answers).length === DISC_QUESTIONS.length && (
          <button
            onClick={calculateProfile}
            disabled={loading}
            className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold text-lg hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'Calculando...' : 'Ver Resultado'}
          </button>
        )}
      </div>
    );
  }

  if (step === 'results' && profile) {
    const primaryProfile = DISC_PROFILES[profile.primary_style as keyof typeof DISC_PROFILES];

    return (
      <div className="space-y-6">
        {/* Primary Style */}
        <div className={`rounded-3xl bg-gradient-to-br from-${primaryProfile.color}-500/20 to-${primaryProfile.color}-600/20 border border-${primaryProfile.color}-500/30 p-8 text-center`}>
          <div className="text-6xl font-bold mb-2">{profile.primary_style}</div>
          <h3 className="text-2xl font-bold text-white mb-2">{primaryProfile.name}</h3>
          <p className="text-slate-300">{primaryProfile.description}</p>
        </div>

        {/* Percentages */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries({
            D: profile.dominance,
            I: profile.influence,
            S: profile.steadiness,
            C: profile.conscientiousness,
          }).map(([key, value]) => {
            const data = DISC_PROFILES[key as keyof typeof DISC_PROFILES];
            return (
              <div key={key} className="rounded-2xl bg-slate-800/50 border border-slate-700 p-4">
                <div className="text-2xl font-bold text-center mb-1">{key}</div>
                <div className={`text-3xl font-bold text-${data.color}-400 text-center mb-2`}>
                  {value}%
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-${data.color}-500 transition-all duration-500`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-6">
            <h4 className="text-lg font-semibold text-emerald-300 mb-4">💪 Pontos Fortes</h4>
            <ul className="space-y-2">
              {primaryProfile.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2">
                  <span>✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-6">
            <h4 className="text-lg font-semibold text-amber-300 mb-4">⚠️ Pontos de Atenção</h4>
            <ul className="space-y-2">
              {primaryProfile.weaknesses.map((weakness, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2">
                  <span>•</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Communication Tips */}
        <div className="rounded-2xl bg-purple-500/10 border border-purple-500/30 p-6">
          <h4 className="text-lg font-semibold text-purple-300 mb-4">
            🗣️ Dicas de Comunicação (Geral)
          </h4>
          <ul className="space-y-2">
            {primaryProfile.tips.map((tip, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span>→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* PNL Scripts */}
        <div className="rounded-2xl bg-pink-500/10 border border-pink-500/30 p-6">
          <h4 className="text-lg font-semibold text-pink-300 mb-4">
            🧠 Scripts PNL Personalizados
          </h4>
          <ul className="space-y-2">
            {profile.communication_tips.map((tip: string, i: number) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Retake Button */}
        <button
          onClick={() => {
            setStep('intro');
            setAnswers({});
          }}
          className="w-full px-4 py-2 bg-slate-700 text-slate-300 rounded-lg font-semibold hover:bg-slate-600 transition"
        >
          Refazer Análise
        </button>
      </div>
    );
  }

  return null;
}
