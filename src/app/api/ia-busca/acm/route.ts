import { NextRequest, NextResponse } from 'next/server';
import { ACMReport } from '@/types/busca-ia';
import { generateMockProperties } from '@/lib/ia-busca/mock-data';

/**
 * API Route: POST /api/ia-busca/acm
 * 
 * Gera relatório ACM (Análise Comparativa de Mercado) para um imóvel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.property_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'property_id is required',
        },
        { status: 400 }
      );
    }

    // Find property
    const properties = generateMockProperties();
    const property = properties.find((p) => p.id === body.property_id);

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: 'Property not found',
          message: `No property found with ID: ${body.property_id}`,
        },
        { status: 404 }
      );
    }

    // Find comparable properties (same concelho, similar typology and area)
    const comparables = properties
      .filter(
        (p) =>
          p.id !== property.id &&
          p.concelho === property.concelho &&
          p.typology === property.typology &&
          Math.abs(p.area_m2 - property.area_m2) < property.area_m2 * 0.2
      )
      .slice(0, 5);

    // Calculate price estimate
    const comparablePrices = comparables.map((p) => p.price_main);
    const avgPrice =
      comparablePrices.reduce((sum, p) => sum + p, 0) /
      (comparablePrices.length || 1);
    const minPrice = Math.min(...comparablePrices, property.price_main) * 0.95;
    const maxPrice = Math.max(...comparablePrices, property.price_main) * 1.05;

    // Generate market analysis (mock)
    const marketAnalysis = `
Análise Comparativa de Mercado para ${property.typology} em ${property.concelho}

Propriedade Analisada:
- Tipologia: ${property.typology}
- Área: ${property.area_m2}m²
- Preço Atual: €${property.price_main.toLocaleString('pt-PT')}
- Localização: ${property.freguesia}, ${property.concelho}

Comparáveis Encontrados: ${comparables.length}

Análise de Preços:
- Preço Médio de Mercado: €${Math.round(avgPrice).toLocaleString('pt-PT')}
- Preço/m²: €${Math.round(avgPrice / property.area_m2).toLocaleString('pt-PT')}
- Variação de Mercado: ${minPrice.toFixed(0)} - ${maxPrice.toFixed(0)}€

Recomendação:
Com base nos comparáveis analisados, o preço da propriedade está ${
      property.price_main > avgPrice ? 'acima' : 'abaixo'
    } da média do mercado em ${Math.abs(((property.price_main - avgPrice) / avgPrice) * 100).toFixed(1)}%.

${
  property.price_main > avgPrice * 1.1
    ? 'Sugestão: Considerar redução de preço para aumentar atratividade.'
    : property.price_main < avgPrice * 0.9
    ? 'Oportunidade: Preço competitivo, pode atrair múltiplas ofertas.'
    : 'Preço alinhado com o mercado atual.'
}
    `.trim();

    // Create ACM report
    const report: ACMReport = {
      id: `acm-${Date.now()}`,
      tenant_id: body.tenant_id || 'demo-tenant-123',
      property_id: body.property_id,
      report_data: {
        comparable_properties: comparables,
        price_estimate: Math.round(avgPrice),
        price_range: [Math.round(minPrice), Math.round(maxPrice)],
        market_analysis: marketAnalysis,
      },
      pdf_path: undefined, // In production, generate PDF
      created_by: body.user_id || 'demo-user-123',
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'ACM report generated successfully',
      report,
    });
  } catch (error) {
    console.error('Error generating ACM report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate ACM report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
