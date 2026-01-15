import { Handler } from '@netlify/functions';
import { createServiceClient } from '../utils/supabase';
import { deduplicateProperties } from '../utils/orchestrator';
import { ListingAppearance } from '../types';

/**
 * Deduplication Engine Runner
 * Runs every 15 minutes to deduplicate property listings
 * Groups similar listings into unique property entities using:
 * - Text embeddings for description similarity
 * - Image perceptual hashes for visual similarity
 * - Location proximity
 */
export const handler: Handler = async (event, context) => {
  console.log('Starting dedup engine runner...');
  
  try {
    const supabase = createServiceClient();

    // Fetch unprocessed listing appearances (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: listings, error } = await supabase
      .from('listing_appearances')
      .select('*')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database error' }),
      };
    }

    if (!listings || listings.length === 0) {
      console.log('No new listings to process');
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No new listings to process',
          processed: 0,
        }),
      };
    }

    console.log(`Processing ${listings.length} listings...`);

    // Deduplicate listings into property entities
    const propertyEntities = await deduplicateProperties(
      listings as ListingAppearance[]
    );

    console.log(`Created/updated ${propertyEntities.length} property entities`);

    // Upsert property entities
    let upsertedCount = 0;
    for (const entity of propertyEntities) {
      const { error: upsertError } = await supabase
        .from('properties')
        .upsert(entity, { onConflict: 'id' });

      if (!upsertError) {
        upsertedCount++;
      } else {
        console.error('Upsert error:', upsertError);
      }
    }

    // Generate embeddings for new properties (in production)
    // This would call a vector embedding service
    for (const entity of propertyEntities) {
      // Mock embedding generation
      const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());
      
      await supabase.from('property_embeddings').upsert({
        property_id: entity.id,
        text_embedding: mockEmbedding,
        quality_score: 0.8,
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Deduplication completed',
        listings_processed: listings.length,
        properties_created: upsertedCount,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('Dedup engine error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Internal server error',
      }),
    };
  }
};
