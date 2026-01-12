import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { period = 'monthly' } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all agents with their statistics
    const { data: agents, error: agentsError } = await supabaseClient
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'agent')

    if (agentsError) throw agentsError

    const rankings = []

    for (const agent of agents) {
      // Calculate sales count
      const { count: salesCount } = await supabaseClient
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .eq('status', 'sold')

      // Calculate leads count
      const { count: leadsCount } = await supabaseClient
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)

      // Calculate total score (sales * 10 + leads * 1)
      const score = (salesCount || 0) * 10 + (leadsCount || 0)

      rankings.push({
        agent_id: agent.id,
        agent_name: agent.full_name,
        period,
        score,
        sales_count: salesCount || 0,
        leads_count: leadsCount || 0,
      })
    }

    // Sort by score
    rankings.sort((a, b) => b.score - a.score)

    // Assign ranks
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1
    })

    // Store rankings in database
    const { error: insertError } = await supabaseClient
      .from('rankings')
      .insert(
        rankings.map(r => ({
          agent_id: r.agent_id,
          period: r.period,
          rank: r.rank,
          score: r.score,
          sales_count: r.sales_count,
          leads_count: r.leads_count,
        }))
      )

    if (insertError) throw insertError

    return new Response(JSON.stringify({ 
      success: true, 
      rankings 
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
