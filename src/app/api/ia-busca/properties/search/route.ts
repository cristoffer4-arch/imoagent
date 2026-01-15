import { NextRequest, NextResponse } from 'next/server';
import { generateMockProperties, filterProperties } from '@/lib/ia-busca/mock-data';
import { SearchFilters } from '@/types/busca-ia';

/**
 * API Route: GET /api/ia-busca/properties/search
 * 
 * Busca imóveis com filtros avançados
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filters from query params
    const mode = (searchParams.get('mode') || 'angariacao') as 'angariacao' | 'venda';
    const concelho = searchParams.get('concelho') || undefined;
    const typology = searchParams.get('typology')?.split(',') || undefined;
    
    // Safely parse numeric parameters with validation
    const parseNumeric = (value: string | null): number | undefined => {
      if (!value) return undefined;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
    };
    
    const priceMin = parseNumeric(searchParams.get('priceMin'));
    const priceMax = parseNumeric(searchParams.get('priceMax'));
    const areaMin = parseNumeric(searchParams.get('areaMin'));
    const areaMax = parseNumeric(searchParams.get('areaMax'));
    const minScore = parseNumeric(searchParams.get('minScore'));

    // Generate mock properties (in production, query from database)
    let properties = generateMockProperties();

    // Apply filters
    properties = filterProperties(properties, {
      concelho,
      typology,
      price_range: priceMin && priceMax ? [priceMin, priceMax] : undefined,
      area_range: areaMin && areaMax ? [areaMin, areaMax] : undefined,
      min_score: minScore,
      mode,
    });

    // Sort by score (descending)
    const sortedProperties = properties.sort((a, b) => {
      const scoreA = mode === 'angariacao' ? a.angaria_score : a.venda_score;
      const scoreB = mode === 'angariacao' ? b.angaria_score : b.venda_score;
      return scoreB - scoreA;
    });

    return NextResponse.json({
      success: true,
      mode,
      count: sortedProperties.length,
      properties: sortedProperties,
      filters: {
        concelho,
        typology,
        price_range: priceMin && priceMax ? [priceMin, priceMax] : null,
        area_range: areaMin && areaMax ? [areaMin, areaMax] : null,
        min_score: minScore,
      },
    });
  } catch (error) {
    console.error('Error in properties search:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search properties',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route: POST /api/ia-busca/properties/search
 * 
 * Busca imóveis com body JSON (para filtros complexos)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters: SearchFilters = body.filters || {};

    // Generate mock properties
    let properties = generateMockProperties();

    // Apply filters
    properties = filterProperties(properties, {
      concelho: filters.location?.concelho,
      typology: filters.typology,
      price_range: filters.price_range,
      area_range: filters.area_range,
      min_score: filters.min_score,
      mode: filters.mode || 'angariacao',
    });

    // Sort by score
    const sortedProperties = properties.sort((a, b) => {
      const scoreA =
        filters.mode === 'venda' ? a.venda_score : a.angaria_score;
      const scoreB =
        filters.mode === 'venda' ? b.venda_score : b.angaria_score;
      return scoreB - scoreA;
    });

    return NextResponse.json({
      success: true,
      mode: filters.mode || 'angariacao',
      count: sortedProperties.length,
      properties: sortedProperties,
      filters,
    });
  } catch (error) {
    console.error('Error in properties search:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search properties',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
