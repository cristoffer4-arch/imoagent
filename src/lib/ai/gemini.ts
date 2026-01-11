import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export const geminiModels = {
  pro: genAI.getGenerativeModel({ model: 'gemini-pro' }),
  proVision: genAI.getGenerativeModel({ model: 'gemini-pro-vision' }),
}

export type AIAgent = 
  | 'search'
  | 'coaching'
  | 'gamification'
  | 'ads'
  | 'legal'
  | 'leads'
  | 'tracking'

export async function callAIAgent(
  agent: AIAgent,
  prompt: string,
  context?: Record<string, unknown>
): Promise<string> {
  const model = geminiModels.pro
  
  const agentPrompts: Record<AIAgent, string> = {
    search: `You are a real estate search assistant. Help find properties across multiple portals. ${prompt}`,
    coaching: `You are a SMART goals coaching assistant. Help agents set and track SMART goals. ${prompt}`,
    gamification: `You are a gamification assistant. Calculate rankings, achievements, and rewards. ${prompt}`,
    ads: `You are a marketing and ads assistant. Help create and optimize property advertisements. ${prompt}`,
    legal: `You are a legal assistant for real estate. Analyze contracts and legal documents. ${prompt}`,
    leads: `You are a lead qualification assistant. Score and route leads efficiently. ${prompt}`,
    tracking: `You are an agenda tracking assistant. Help manage appointments and time tracking. ${prompt}`,
  }

  const fullPrompt = `${agentPrompts[agent]}\n\nContext: ${JSON.stringify(context || {})}`
  
  try {
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error(`Error calling ${agent} AI agent:`, error)
    throw error
  }
}
