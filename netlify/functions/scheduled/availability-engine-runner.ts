import { Handler } from '@netlify/functions';
import { createServiceClient } from '../utils/supabase';

/**
 * Availability Engine Runner
 * Runs every hour to calculate availability probability for properties
 * Based on:
 * - Recency of listings
 * - Number of active sources
 * - Historical patterns
 * - Portal response times
 */
export const handler: Handler = async (event, context) => {
  console.log('Starting availability engine runner...');
  
  try {
    const supabase = createServiceClient();

    // Fetch all active properties
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, portal_count, last_seen, first_seen')
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

    console.log(`Processing ${properties.length} properties...`);

    let updatedCount = 0;

    for (const property of properties) {
      // Calculate availability probability
      const daysSinceLastSeen = property.last_seen
        ? Math.floor(
            (Date.now() - new Date(property.last_seen).getTime()) / (1000 * 60 * 60 * 24)
          )
        : 999;

      let availability_probability = 0.5;

      // Recency factor
      if (daysSinceLastSeen < 7) {
        availability_probability = 0.9;
      } else if (daysSinceLastSeen < 30) {
        availability_probability = 0.7;
      } else if (daysSinceLastSeen < 90) {
        availability_probability = 0.4;
      } else {
        availability_probability = 0.1;
      }

      // Portal count boost
      if (property.portal_count && property.portal_count > 3) {
        availability_probability = Math.min(1.0, availability_probability + 0.1);
      }

      // Days on market penalty
      const daysOnMarket = property.first_seen
        ? Math.floor(
            (Date.now() - new Date(property.first_seen).getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0;

      if (daysOnMarket > 180) {
        availability_probability *= 0.7;
      }

      // Update property
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          availability_probability,
          derived_recency: daysSinceLastSeen,
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
        message: 'Availability calculation completed',
        properties_processed: properties.length,
        properties_updated: updatedCount,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('Availability engine error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Internal server error',
      }),
    };
  }
};
