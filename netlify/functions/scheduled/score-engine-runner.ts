import { Handler } from '@netlify/functions';
import { createServiceClient } from '../utils/supabase';
import { calculateScores } from '../utils/orchestrator';
import { PropertyEntity } from '../types';

/**
 * Score Engine Runner
 * Runs every hour to update AngariaScore and VendaScore
 * Considers:
 * - Recency
 * - Price divergence
 * - Portal count
 * - Availability probability
 * - Market events
 */
export const handler: Handler = async (event, context) => {
  console.log('Starting score engine runner...');
  
  try {
    const supabase = createServiceClient();

    // Fetch all active properties
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .order('updated_at', { ascending: true })
      .limit(1000);

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database error' }),
      };
    }

    if (!properties || properties.length === 0) {
      console.log('No properties to process');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No properties to process' }),
      };
    }

    console.log(`Processing ${properties.length} properties for scoring...`);

    let updatedCount = 0;

    for (const property of properties) {
      // Calculate scores
      const scores = await calculateScores(property as PropertyEntity);

      // Determine top reasons for scores
      const top_reasons: any = {
        angaria: [],
        venda: [],
      };

      // Recency
      const daysSinceLastSeen = property.last_seen
        ? Math.floor(
            (Date.now() - new Date(property.last_seen).getTime()) / (1000 * 60 * 60 * 24)
          )
        : 999;

      if (daysSinceLastSeen < 7) {
        top_reasons.angaria.push('Recente no mercado');
        top_reasons.venda.push('Anúncio ativo');
      }

      // Price divergence
      if (property.price_divergence_pct && property.price_divergence_pct > 10) {
        top_reasons.angaria.push(`Divergência de preço: ${property.price_divergence_pct.toFixed(0)}%`);
      }

      // Multiple portals
      if (property.portal_count && property.portal_count > 3) {
        top_reasons.angaria.push(`${property.portal_count} portais diferentes`);
        top_reasons.venda.push('Alta visibilidade');
      }

      // Availability
      if (scores.availability_probability > 0.7) {
        top_reasons.venda.push('Alta probabilidade de disponibilidade');
      }

      // Update property with scores
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          angaria_score: scores.angaria_score,
          venda_score: scores.venda_score,
          availability_probability: scores.availability_probability,
          top_reasons,
          updated_at: new Date().toISOString(),
        })
        .eq('id', property.id);

      if (!updateError) {
        updatedCount++;
      } else {
        console.error('Update error:', updateError);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Score calculation completed',
        properties_processed: properties.length,
        properties_updated: updatedCount,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('Score engine error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Internal server error',
      }),
    };
  }
};
