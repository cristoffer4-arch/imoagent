import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createSupabaseClient, getTenantIdFromToken } from './utils/supabase';
import { SearchFilters, SearchResponse } from './types';

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

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Validate auth
    const authHeader = event.headers.authorization || '';
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const tenant_id = getTenantIdFromToken(authHeader);
    const supabase = createSupabaseClient(authHeader);

    // Parse query parameters
    const params = event.queryStringParameters || {};
    const filters: SearchFilters = {
      mode: (params.mode as 'angariacao' | 'venda') || 'venda',
      typology: params.typology,
      distrito: params.distrito,
      concelho: params.concelho,
      freguesia: params.freguesia,
      price_min: params.price_min ? parseFloat(params.price_min) : undefined,
      price_max: params.price_max ? parseFloat(params.price_max) : undefined,
      bedrooms: params.bedrooms ? parseInt(params.bedrooms, 10) : undefined,
      area_min: params.area_min ? parseFloat(params.area_min) : undefined,
      area_max: params.area_max ? parseFloat(params.area_max) : undefined,
    };

    const page = parseInt(params.page || '1', 10);
    const per_page = Math.min(parseInt(params.per_page || '20', 10), 100);

    // Build query
    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenant_id);

    // Apply filters
    if (filters.typology) {
      query = query.eq('typology', filters.typology);
    }
    if (filters.distrito) {
      query = query.eq('distrito', filters.distrito);
    }
    if (filters.concelho) {
      query = query.eq('concelho', filters.concelho);
    }
    if (filters.freguesia) {
      query = query.eq('freguesia', filters.freguesia);
    }
    if (filters.price_min !== undefined) {
      query = query.gte('price_main', filters.price_min);
    }
    if (filters.price_max !== undefined) {
      query = query.lte('price_main', filters.price_max);
    }
    if (filters.bedrooms !== undefined) {
      query = query.eq('bedrooms', filters.bedrooms);
    }
    if (filters.area_min !== undefined) {
      query = query.gte('area_m2', filters.area_min);
    }
    if (filters.area_max !== undefined) {
      query = query.lte('area_m2', filters.area_max);
    }

    // Order by score based on mode
    const orderBy = filters.mode === 'angariacao' ? 'angaria_score' : 'venda_score';
    query = query.order(orderBy, { ascending: false });

    // Pagination
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Database error' }),
      };
    }

    const response: SearchResponse = {
      properties: data || [],
      total: count || 0,
      page,
      per_page,
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
