/**
 * Casafari Integration Example
 * 
 * Este arquivo demonstra como usar o CasafariService no Imoagent.
 */

import { createCasafariService } from '../services/casafari';
import type { CasafariSearchFilters } from '../services/casafari';

/**
 * Exemplo 1: Listar propriedades
 */
export async function exemplo1_listarPropriedades() {
  // Cria instância do serviço (usa CASAFARI_API_KEY do .env)
  const casafari = createCasafariService();
  
  try {
    // Lista propriedades com paginação
    const result = await casafari.listProperties(
      undefined, // Sem filtros
      'tenant-123', // Tenant ID
      'team-456' // Team ID (opcional)
    );
    
    console.log(`Encontradas ${result.properties.length} propriedades`);
    console.log(`Página ${result.pagination.page} de ${result.pagination.totalPages}`);
    
    // Propriedades já estão transformadas para PropertyCanonicalModel
    result.properties.forEach(prop => {
      console.log(`- ${prop.title || 'Sem título'} - ${prop.price.value}€`);
    });
    
    return result;
  } catch (error) {
    console.error('Erro ao listar propriedades:', error);
    throw error;
  }
}

/**
 * Exemplo 2: Buscar propriedades com filtros
 */
export async function exemplo2_buscarComFiltros() {
  const casafari = createCasafariService();
  
  // Define filtros de busca
  const filters: CasafariSearchFilters = {
    // Localização
    district: 'Lisboa',
    municipality: 'Lisboa',
    
    // Tipo de propriedade
    propertyType: ['apartment', 'house'],
    transactionType: 'sale',
    
    // Preço
    minPrice: 200000,
    maxPrice: 500000,
    
    // Características
    minBedrooms: 2,
    minArea: 80,
    
    // Paginação
    page: 1,
    limit: 20,
    
    // Ordenação
    sortBy: 'price',
    sortOrder: 'asc',
  };
  
  try {
    const result = await casafari.searchProperties(
      filters,
      'tenant-123'
    );
    
    console.log(`Busca retornou ${result.properties.length} propriedades`);
    
    // Filtra apenas imóveis em Lisboa com varanda
    const comVaranda = result.properties.filter(
      prop => prop.characteristics.features?.balcony === true
    );
    
    console.log(`${comVaranda.length} propriedades com varanda`);
    
    return result;
  } catch (error) {
    console.error('Erro na busca:', error);
    throw error;
  }
}

/**
 * Exemplo 3: Obter detalhes de uma propriedade
 */
export async function exemplo3_detalhesPropriedade(propertyId: string) {
  const casafari = createCasafariService();
  
  try {
    const property = await casafari.getPropertyDetails(
      propertyId,
      'tenant-123'
    );
    
    if (!property) {
      console.log('Propriedade não encontrada');
      return null;
    }
    
    console.log('Detalhes da propriedade:');
    console.log(`Título: ${property.title}`);
    console.log(`Tipo: ${property.type}`);
    console.log(`Preço: ${property.price.value}${property.price.currency}`);
    console.log(`Localização: ${property.location.address.concelho}, ${property.location.address.distrito}`);
    console.log(`Área: ${property.characteristics.usefulArea}m²`);
    console.log(`Quartos: ${property.characteristics.bedrooms}`);
    console.log(`Qualidade dos dados: ${property.metadata.dataQuality}`);
    console.log(`Imagens: ${property.images?.length || 0}`);
    
    return property;
  } catch (error) {
    console.error('Erro ao obter detalhes:', error);
    throw error;
  }
}

/**
 * Exemplo 4: Usar com cache
 */
export async function exemplo4_usarCache() {
  const casafari = createCasafariService();
  
  console.log('Primeira chamada (faz fetch):');
  const inicio1 = Date.now();
  const result1 = await casafari.listProperties(undefined, 'tenant-123');
  console.log(`Tempo: ${Date.now() - inicio1}ms`);
  
  console.log('Segunda chamada (usa cache):');
  const inicio2 = Date.now();
  const result2 = await casafari.listProperties(undefined, 'tenant-123');
  console.log(`Tempo: ${Date.now() - inicio2}ms`);
  
  console.log('Terceira chamada após limpar cache:');
  casafari.clearCache();
  const inicio3 = Date.now();
  const result3 = await casafari.listProperties(undefined, 'tenant-123');
  console.log(`Tempo: ${Date.now() - inicio3}ms`);
  
  return { result1, result2, result3 };
}

/**
 * Exemplo 5: Integração com IA Busca via Orquestradora
 */
export async function exemplo5_integracaoOrquestradora() {
  // Simula chamada através da IA Orquestradora
  const orchestratorPayload = {
    event: 'buscar_propriedades',
    target: 'ia-busca',
    casafariQuery: {
      action: 'search' as const,
      filters: {
        municipality: 'Porto',
        minPrice: 150000,
        maxPrice: 300000,
        minBedrooms: 2,
      },
    },
  };
  
  // Em produção, isso seria uma chamada à Edge Function
  console.log('Chamada orquestrada:', orchestratorPayload);
  
  // O resultado viria da IA Busca que usa CasafariService internamente
  const casafari = createCasafariService();
  const result = await casafari.searchProperties(
    orchestratorPayload.casafariQuery.filters,
    'tenant-123'
  );
  
  return {
    orchestratorResponse: {
      status: 'success',
      source: 'ia-busca',
      casafariIntegrated: true,
      propertiesFound: result.properties.length,
    },
    properties: result.properties,
  };
}

/**
 * Exemplo 6: Tratamento de erros
 */
export async function exemplo6_tratamentoErros() {
  // Usa configuração com API key inválida
  const casafari = createCasafariService({
    apiKey: 'invalid-key',
  });
  
  try {
    await casafari.listProperties(undefined, 'tenant-123');
  } catch (error: any) {
    if (error.name === 'CasafariApiError') {
      console.error('Erro da API Casafari:');
      console.error(`- Código HTTP: ${error.statusCode}`);
      console.error(`- Código do erro: ${error.code}`);
      console.error(`- Mensagem: ${error.message}`);
      console.error(`- Detalhes:`, error.details);
      
      // Tratamento específico por tipo de erro
      if (error.statusCode === 401) {
        console.error('❌ API key inválida ou expirada');
      } else if (error.statusCode === 404) {
        console.error('❌ Recurso não encontrado');
      } else if (error.statusCode === 429) {
        console.error('❌ Limite de requisições excedido');
      } else if (error.statusCode === 0) {
        console.error('❌ Erro de rede ou timeout');
      }
    } else {
      console.error('Erro desconhecido:', error);
    }
  }
}

/**
 * Exemplo completo de uso no contexto do Imoagent
 */
export async function exemploCompleto_fluxoImoagent() {
  console.log('=== FLUXO COMPLETO IMOAGENT + CASAFARI ===\n');
  
  // 1. Usuário consultor acessa o dashboard
  console.log('1. Consultor acessa IA Busca');
  
  // 2. Sistema cria serviço Casafari
  const casafari = createCasafariService();
  console.log('2. CasafariService inicializado');
  
  // 3. Consultor busca imóveis em Lisboa para cliente
  console.log('3. Buscando imóveis T2 em Lisboa (200k-350k)...');
  const resultadoBusca = await casafari.searchProperties(
    {
      district: 'Lisboa',
      propertyType: ['apartment'],
      transactionType: 'sale',
      minPrice: 200000,
      maxPrice: 350000,
      minBedrooms: 2,
      limit: 10,
    },
    'consultor-tenant-abc',
    'equipe-lisboa-123'
  );
  
  console.log(`✓ ${resultadoBusca.properties.length} propriedades encontradas`);
  
  // 4. Sistema calcula scores de IA para cada propriedade
  console.log('4. Calculando scores de angariação...');
  const propriedadesComScore = resultadoBusca.properties.map(prop => {
    // Em produção, isso seria feito pela IA Gemini
    const mockScore = Math.floor(Math.random() * 40) + 60; // 60-100
    prop.aiScores = {
      acquisitionScore: mockScore,
      availabilityProbability: Math.random(),
      topReasons: ['Preço competitivo', 'Localização premium', 'Bom estado'],
    };
    return prop;
  });
  
  // 5. Ordena por score de angariação
  propriedadesComScore.sort(
    (a, b) => (b.aiScores?.acquisitionScore || 0) - (a.aiScores?.acquisitionScore || 0)
  );
  
  console.log('5. Top 3 propriedades recomendadas:');
  propriedadesComScore.slice(0, 3).forEach((prop, i) => {
    console.log(`   ${i + 1}. ${prop.title || 'Sem título'}`);
    console.log(`      Preço: ${prop.price.value}€`);
    console.log(`      Score: ${prop.aiScores?.acquisitionScore}/100`);
    console.log(`      Qualidade: ${prop.metadata.dataQuality}`);
  });
  
  // 6. Consultor visualiza detalhes da melhor opção
  const melhorOpcao = propriedadesComScore[0];
  console.log(`\n6. Obtendo detalhes completos da propriedade ${melhorOpcao.id}...`);
  
  const detalhes = await casafari.getPropertyDetails(
    melhorOpcao.id.replace('casafari_', ''), // Remove prefixo
    'consultor-tenant-abc'
  );
  
  if (detalhes) {
    console.log('✓ Detalhes carregados:');
    console.log(`   - ${detalhes.images?.length || 0} fotos`);
    console.log(`   - ${detalhes.characteristics.features ? Object.keys(detalhes.characteristics.features).length : 0} características`);
    console.log(`   - Última atualização: ${detalhes.metadata.lastUpdated.toLocaleString()}`);
  }
  
  console.log('\n=== FLUXO CONCLUÍDO COM SUCESSO ===');
  
  return {
    totalEncontradas: resultadoBusca.properties.length,
    top3: propriedadesComScore.slice(0, 3),
    detalhesTop1: detalhes,
  };
}
