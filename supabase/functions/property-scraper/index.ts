import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PORTALS = [
  { name: 'ZAP Imóveis', url: 'https://www.zapimoveis.com.br' },
  { name: 'Viva Real', url: 'https://www.vivareal.com.br' },
  { name: 'Imovelweb', url: 'https://www.imovelweb.com.br' },
  { name: 'OLX', url: 'https://www.olx.com.br/imoveis' },
  { name: 'QuintoAndar', url: 'https://www.quintoandar.com.br' },
  { name: 'Chaves na Mão', url: 'https://www.chavesnamao.com.br' },
  { name: 'Tem Casa', url: 'https://www.temcasa.com.br' },
]

serve(async (req) => {
  try {
    const { city, type, minPrice, maxPrice } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const results = []

    // Simulate scraping from multiple portals
    for (const portal of PORTALS) {
      // In production, this would use actual web scraping logic
      // For now, we'll simulate results
      const mockProperties = Array.from({ length: 5 }, (_, i) => ({
        portal: portal.name,
        title: `Imóvel ${i + 1} em ${city}`,
        price: Math.floor(Math.random() * (maxPrice - minPrice)) + minPrice,
        type: type || 'apartment',
        url: `${portal.url}/property/${i + 1}`,
        images: [`https://picsum.photos/400/300?random=${i}`],
        bedrooms: Math.floor(Math.random() * 4) + 1,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        area: Math.floor(Math.random() * 150) + 50,
      }))

      results.push(...mockProperties)
    }

    // Store results in database
    const { data, error } = await supabaseClient
      .from('activities')
      .insert({
        user_id: req.headers.get('user-id'),
        type: 'property_search',
        description: `Searched for properties in ${city}`,
        metadata: { city, type, resultsCount: results.length },
      })

    return new Response(JSON.stringify({ 
      success: true, 
      properties: results,
      portalsScanned: PORTALS.length 
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
