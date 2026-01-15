import { NextRequest, NextResponse } from 'next/server';
import { Opportunity } from '@/types/busca-ia';

/**
 * API Route: POST /api/ia-busca/opportunities
 * 
 * Cria uma nova oportunidade (Angariação ou Venda)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.property_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'type and property_id are required',
        },
        { status: 400 }
      );
    }

    // In production, save to database
    // For MVP, return mock response
    const opportunity: Opportunity = {
      id: `opp-${Date.now()}`,
      tenant_id: body.tenant_id || 'demo-tenant-123',
      team_id: body.team_id,
      type: body.type,
      status: 'new',
      pipeline_stage: body.type === 'ANGARIACAO' ? 'Contacto Inicial' : 'Lead Qualificado',
      property_id: body.property_id,
      contact_id: body.contact_id,
      owner_user_id: body.owner_user_id || 'demo-user-123',
      notes: body.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Opportunity created successfully',
      opportunity,
    });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create opportunity',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route: GET /api/ia-busca/opportunities
 * 
 * Lista oportunidades do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user-123';
    const type = searchParams.get('type'); // ANGARIACAO | VENDA

    // In production, query from database
    // For MVP, return mock opportunities
    let mockOpportunities: Opportunity[] = [
      {
        id: 'opp-1',
        tenant_id: 'demo-tenant-123',
        type: 'ANGARIACAO',
        status: 'in_progress',
        pipeline_stage: 'Em Negociação',
        property_id: 'prop-001',
        owner_user_id: userId,
        notes: 'Proprietário interessado, aguarda proposta',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'opp-2',
        tenant_id: 'demo-tenant-123',
        type: 'VENDA',
        status: 'new',
        pipeline_stage: 'Lead Qualificado',
        property_id: 'prop-015',
        owner_user_id: userId,
        notes: 'Cliente procura T3 em Cascais',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Filter by type if specified
    if (type) {
      mockOpportunities = mockOpportunities.filter((opp) => opp.type === type);
    }

    return NextResponse.json({
      success: true,
      count: mockOpportunities.length,
      opportunities: mockOpportunities,
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch opportunities',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
