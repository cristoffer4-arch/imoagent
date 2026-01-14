import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { messages, sessionType, userContext } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const systemPrompt = `Você é um coach executivo e business coach especializado em consultores imobiliários em Portugal. 

CONTEXTO DO USUÁRIO:
${userContext ? JSON.stringify(userContext, null, 2) : 'Nenhum contexto fornecido'}

TIPO DE SESSÃO: ${sessionType || 'geral'}

DIRETRIZES:
- Use metodologia SMART para definição de metas
- Aplique técnicas de PNL para comunicação persuasiva
- Faça análise SWOT quando apropriado
- Seja objetivo, prático e motivador
- Foque em resultados mensuráveis
- Sugira ações concretas e específicas
- Use exemplos do mercado imobiliário português
- Mantenha tom profissional mas acessível
- Faça perguntas poderosas para reflexão
- Desafie o consultor a sair da zona de conforto

FOCO POR TIPO DE SESSÃO:
- diagnosis: Entender situação atual, desafios, oportunidades
- goal_setting: Definir metas SMART e derivar metas operacionais
- review: Analisar resultados, identificar gaps, ajustar estratégias
- strategy: Desenvolver estratégias de prospecção, negociação, fechamento
- action_plan: Criar plano de ação detalhado com atividades diárias/semanais`;

    const chatHistory = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Entendido. Estou pronto para atuar como seu coach executivo especializado em consultoria imobiliária. Como posso ajudá-lo hoje?' }],
        },
        ...chatHistory.slice(0, -1),
      ],
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = result.response.text();

    // Extract insights and commitments
    const insights: string[] = [];
    const commitments: string[] = [];
    
    const insightMatches = response.match(/(?:insight|perceção|aprendizado):\s*(.+)/gi);
    if (insightMatches) {
      insights.push(...insightMatches.map(m => m.split(':')[1].trim()));
    }

    const commitmentMatches = response.match(/(?:compromisso|ação|vou fazer):\s*(.+)/gi);
    if (commitmentMatches) {
      commitments.push(...commitmentMatches.map(m => m.split(':')[1].trim()));
    }

    return NextResponse.json({
      response,
      insights,
      commitments,
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to get coaching response' },
      { status: 500 }
    );
  }
}
