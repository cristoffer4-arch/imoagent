import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createSupabaseClient } from './utils/supabase';
import { PropertyDetailResponse } from './types';

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const authHeader = event.headers.authorization || '';
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const supabase = createSupabaseClient(authHeader);

    // Extract property ID from path
    const propertyId = event.path.split('/').pop();
    if (!propertyId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Property ID required' }),
      };
    }

    // Fetch property
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Property not found' }),
      };
    }

    // Fetch related listing appearances
    const { data: listings } = await supabase
      .from('listing_appearances')
      .select('*')
      .eq('property_entity_id', propertyId);

    // Fetch market events
    const { data: events } = await supabase
      .from('market_events')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    // Fetch opportunities
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('*')
      .eq('property_id', propertyId);

    const response: PropertyDetailResponse = {
      property,
      listing_appearances: listings || [],
      market_events: events || [],
      opportunities: opportunities || [],
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal server error',
      }),
    };
  }
};
