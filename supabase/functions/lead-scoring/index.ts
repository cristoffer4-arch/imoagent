import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { leadId } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get lead details
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError) throw leadError

    // Calculate lead score based on various factors
    let score = 0

    // Email provided: +10 points
    if (lead.email) score += 10

    // Phone provided: +10 points
    if (lead.phone) score += 10

    // Message length: up to 20 points
    if (lead.message) {
      score += Math.min(lead.message.length / 10, 20)
    }

    // Property specified: +15 points
    if (lead.property_id) score += 15

    // Recent lead: +15 points (within last 24 hours)
    const createdAt = new Date(lead.created_at)
    const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceCreation < 24) score += 15

    // Normalize score to 0-100
    const normalizedScore = Math.min(Math.round(score), 100)

    // Update lead with calculated score
    const { error: updateError } = await supabaseClient
      .from('leads')
      .update({ score: normalizedScore })
      .eq('id', leadId)

    if (updateError) throw updateError

    // Route to best available agent if not assigned
    if (!lead.agent_id) {
      const { data: agents } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('role', 'agent')
        .limit(1)

      if (agents && agents.length > 0) {
        await supabaseClient
          .from('leads')
          .update({ agent_id: agents[0].id })
          .eq('id', leadId)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      leadId,
      score: normalizedScore 
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
