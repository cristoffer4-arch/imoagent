import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const { agentId, goals } = await req.json()

    // Use Gemini AI to provide coaching recommendations
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    
    const prompt = `As a SMART goals coach for real estate agents, analyze these goals and provide actionable recommendations:
    
Goals: ${JSON.stringify(goals)}

Provide:
1. Progress assessment
2. Specific action items
3. Motivational message
4. Time management tips
5. Resources or training suggestions`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })

    const data = await response.json()
    const recommendations = data.candidates[0].content.parts[0].text

    return new Response(JSON.stringify({ 
      success: true,
      agentId,
      recommendations
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
