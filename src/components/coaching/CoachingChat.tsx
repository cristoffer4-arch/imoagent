"use client";

import { useState, useRef, useEffect } from 'react';
import { createCoachingSession, updateCoachingSession } from '@/lib/supabase-coaching';
import type { ChatMessage } from '@/types/coaching';

const SESSION_TYPES = [
  { type: 'diagnosis', label: 'Diagnóstico', icon: '🔍', description: 'Avaliar situação atual' },
  { type: 'goal_setting', label: 'Definir Metas', icon: '🎯', description: 'Estabelecer objetivos SMART' },
  { type: 'review', label: 'Revisão', icon: '📊', description: 'Analisar resultados' },
  { type: 'strategy', label: 'Estratégia', icon: '🧠', description: 'Desenvolver táticas' },
  { type: 'action_plan', label: 'Plano de Ação', icon: '📝', description: 'Criar roteiro prático' },
];

export function CoachingChat({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionType, setSessionType] = useState<string>('diagnosis');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [commitments, setCommitments] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function startNewSession(type: string) {
    setSessionType(type);
    setMessages([]);
    setInsights([]);
    setCommitments([]);
    
    try {
      const session = await createCoachingSession({
        user_id: userId,
        session_type: type,
        messages: [],
        insights: [],
        commitments: [],
        follow_ups: [],
      });
      setSessionId(session.id);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          sessionType,
          userContext: { userId },
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      if (data.insights?.length > 0) {
        setInsights([...insights, ...data.insights]);
      }
      if (data.commitments?.length > 0) {
        setCommitments([...commitments, ...data.commitments]);
      }

      // Update session in Supabase
      if (sessionId) {
        await updateCoachingSession(sessionId, {
          messages: updatedMessages,
          insights: [...insights, ...(data.insights || [])],
          commitments: [...commitments, ...(data.commitments || [])],
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date().toISOString(),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Session Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {SESSION_TYPES.map((type) => (
          <button
            key={type.type}
            onClick={() => startNewSession(type.type)}
            className={`p-3 rounded-xl border-2 transition ${
              sessionType === type.type
                ? 'border-emerald-500 bg-emerald-500/20'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className="text-2xl mb-1">{type.icon}</div>
            <div className="text-sm font-semibold text-slate-100">{type.label}</div>
            <div className="text-xs text-slate-400">{type.description}</div>
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700 overflow-hidden">
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p>Selecione um tipo de sessão e comece a conversa</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>

      {/* Insights and Commitments */}
      {(insights.length > 0 || commitments.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.length > 0 && (
            <div className="rounded-2xl bg-blue-500/10 border border-blue-500/30 p-4">
              <h4 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                💡 Insights
              </h4>
              <ul className="space-y-2">
                {insights.map((insight, index) => (
                  <li key={index} className="text-sm text-slate-300 flex gap-2">
                    <span>•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {commitments.length > 0 && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
              <h4 className="text-lg font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                ✅ Compromissos
              </h4>
              <ul className="space-y-2">
                {commitments.map((commitment, index) => (
                  <li key={index} className="text-sm text-slate-300 flex gap-2">
                    <span>•</span>
                    <span>{commitment}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
