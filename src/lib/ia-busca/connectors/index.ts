import { IdealistaConnector } from './idealista';
import { OLXConnector } from './olx';
import { PortalConnector, PropertyListing } from './base';

/**
 * Gerenciador de conectores de portais
 */
export class ConnectorManager {
  private connectors: Map<string, PortalConnector> = new Map();

  constructor() {
    // Inicializar conectores
    this.connectors.set('idealista', new IdealistaConnector());
    this.connectors.set('olx', new OLXConnector());
    
    // Outros portais (stubs para futuro)
    // this.connectors.set('imovirtual', new ImovirtualConnector());
    // this.connectors.set('casasapo', new CasaSapoConnector());
    // this.connectors.set('bpi', new BPIConnector());
    // this.connectors.set('facebook', new FacebookConnector());
    // this.connectors.set('casafari', new CasafariConnector());
  }

  /**
   * Obtém connector específico
   */
  getConnector(portalName: string): PortalConnector | undefined {
    return this.connectors.get(portalName);
  }

  /**
   * Busca em múltiplos portais em paralelo
   */
  async searchAll(
    portals: string[],
    params: {
      location?: string;
      typology?: string;
      priceMin?: number;
      priceMax?: number;
      areaMin?: number;
      areaMax?: number;
    }
  ): Promise<Map<string, PropertyListing[]>> {
    const results = new Map<string, PropertyListing[]>();

    const searchPromises = portals.map(async (portalName) => {
      const connector = this.connectors.get(portalName);
      if (!connector) {
        console.warn(`Connector not found for portal: ${portalName}`);
        return { portalName, listings: [] };
      }

      try {
        const listings = await connector.search(params);
        return { portalName, listings };
      } catch (error) {
        console.error(`Error searching ${portalName}:`, error);
        return { portalName, listings: [] };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    for (const { portalName, listings } of searchResults) {
      results.set(portalName, listings);
    }

    return results;
  }

  /**
   * Verifica saúde de todos os conectores
   */
  async healthCheckAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    const healthPromises = Array.from(this.connectors.entries()).map(
      async ([name, connector]) => {
        const isHealthy = await connector.healthCheck();
        return { name, isHealthy };
      }
    );

    const healthResults = await Promise.all(healthPromises);

    for (const { name, isHealthy } of healthResults) {
      results.set(name, isHealthy);
    }

    return results;
  }

  /**
   * Lista todos os portais disponíveis
   */
  listPortals(): string[] {
    return Array.from(this.connectors.keys());
  }
}

export const connectorManager = new ConnectorManager();
