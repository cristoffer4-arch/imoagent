import { NextRequest, NextResponse } from 'next/server';
import { generateMockProperties } from '@/lib/ia-busca/mock-data';

/**
 * API Route: GET /api/ia-busca/properties/[id]
 * 
 * Busca um imóvel específico por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // In production, query from database
    // For MVP, search in mock data
    const properties = generateMockProperties();
    const property = properties.find((p) => p.id === id);

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: 'Property not found',
          message: `No property found with ID: ${id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      property,
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch property',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
