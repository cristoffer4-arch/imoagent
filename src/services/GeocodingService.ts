/**
 * GeocodingService - Serviço de geocodificação e normalização de endereços
 * 
 * Fornece funcionalidades para converter endereços em coordenadas geográficas
 * e vice-versa, além de normalizar endereços portugueses.
 */

import type { PropertyLocation } from '../PropertyCanonicalModel';

/**
 * Interface para resultado de geocodificação
 */
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  formattedAddress: string;
  address: {
    street?: string;
    number?: string;
    postalCode?: string;
    freguesia?: string;
    concelho: string;
    distrito: string;
    country: string;
  };
  geohash?: string;
}

/**
 * Interface para resultado de geocodificação reversa
 */
export interface ReverseGeocodingResult {
  formattedAddress: string;
  address: {
    street?: string;
    number?: string;
    postalCode?: string;
    freguesia?: string;
    concelho: string;
    distrito: string;
    country: string;
  };
}

/**
 * Serviço de Geocodificação
 * 
 * Nota: Esta é uma implementação base. Em produção, você deve integrar
 * com serviços reais como:
 * - Google Maps Geocoding API
 * - OpenStreetMap Nominatim
 * - Here Maps Geocoding API
 * - MapBox Geocoding API
 */
export class GeocodingService {
  private static readonly BASE_URL = process.env.GEOCODING_API_URL || '';
  private static readonly API_KEY = process.env.GEOCODING_API_KEY || '';

  /**
   * Converte um endereço em coordenadas geográficas
   */
  static async geocode(address: string): Promise<GeocodingResult | null> {
    // Implementação mock para desenvolvimento
    // Em produção, substituir por chamada real à API
    if (!this.BASE_URL || !this.API_KEY) {
      return this.mockGeocode(address);
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/geocode?address=${encodeURIComponent(address)}&key=${this.API_KEY}`
      );

      if (!response.ok) {
        console.error('Geocoding API error:', response.statusText);
        return null;
      }

      const data = await response.json();
      return this.parseGeocodingResponse(data);
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Converte coordenadas em endereço
   */
  static async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodingResult | null> {
    // Implementação mock para desenvolvimento
    if (!this.BASE_URL || !this.API_KEY) {
      return this.mockReverseGeocode(latitude, longitude);
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/reverse?lat=${latitude}&lon=${longitude}&key=${this.API_KEY}`
      );

      if (!response.ok) {
        console.error('Reverse geocoding API error:', response.statusText);
        return null;
      }

      const data = await response.json();
      return this.parseReverseGeocodingResponse(data);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Normaliza localização de uma propriedade
   * Adiciona coordenadas se houver endereço, ou vice-versa
   */
  static async normalizeLocation(
    location: PropertyLocation
  ): Promise<PropertyLocation> {
    const normalized = { ...location };

    // Se tem endereço mas não tem coordenadas, geocodifica
    if (
      !location.coordinates &&
      location.address.concelho &&
      location.address.distrito
    ) {
      const addressStr = this.formatAddressForGeocoding(location.address);
      const result = await this.geocode(addressStr);

      if (result) {
        normalized.coordinates = {
          latitude: result.latitude,
          longitude: result.longitude,
          accuracy: result.accuracy,
        };
        normalized.geohash = result.geohash;
        normalized.formattedAddress = result.formattedAddress;

        // Preenche dados faltantes do endereço
        if (!normalized.address.freguesia && result.address.freguesia) {
          normalized.address.freguesia = result.address.freguesia;
        }
        if (!normalized.address.postalCode && result.address.postalCode) {
          normalized.address.postalCode = result.address.postalCode;
        }
      }
    }

    // Se tem coordenadas mas endereço incompleto, faz geocodificação reversa
    if (
      location.coordinates &&
      (!location.address.concelho || !location.address.distrito)
    ) {
      const result = await this.reverseGeocode(
        location.coordinates.latitude,
        location.coordinates.longitude
      );

      if (result) {
        normalized.address = {
          ...normalized.address,
          ...result.address,
        };
        normalized.formattedAddress = result.formattedAddress;
      }
    }

    // Calcula geohash se ainda não tiver
    if (normalized.coordinates && !normalized.geohash) {
      normalized.geohash = this.calculateGeohash(
        normalized.coordinates.latitude,
        normalized.coordinates.longitude
      );
    }

    return normalized;
  }

  /**
   * Formata endereço para geocodificação
   */
  private static formatAddressForGeocoding(address: PropertyLocation['address']): string {
    const parts = [];

    if (address.street) parts.push(address.street);
    if (address.number) parts.push(address.number);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.freguesia) parts.push(address.freguesia);
    if (address.concelho) parts.push(address.concelho);
    if (address.distrito) parts.push(address.distrito);
    if (address.country) parts.push(address.country);

    return parts.join(', ');
  }

  /**
   * Calcula geohash para um par de coordenadas
   * 
   * Geohash é uma técnica de codificação de localização geográfica
   * que divide o mundo em uma grade hierárquica.
   */
  static calculateGeohash(
    latitude: number,
    longitude: number,
    precision: number = 9
  ): string {
    const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    let hash = '';
    let latMin = -90,
      latMax = 90;
    let lonMin = -180,
      lonMax = 180;
    let isEven = true;
    let bit = 0;
    let ch = 0;

    while (hash.length < precision) {
      if (isEven) {
        const lonMid = (lonMin + lonMax) / 2;
        if (longitude > lonMid) {
          ch |= 1 << (4 - bit);
          lonMin = lonMid;
        } else {
          lonMax = lonMid;
        }
      } else {
        const latMid = (latMin + latMax) / 2;
        if (latitude > latMid) {
          ch |= 1 << (4 - bit);
          latMin = latMid;
        } else {
          latMax = latMid;
        }
      }

      isEven = !isEven;

      if (bit < 4) {
        bit++;
      } else {
        hash += BASE32[ch];
        bit = 0;
        ch = 0;
      }
    }

    return hash;
  }

  /**
   * Calcula distância entre duas coordenadas (em metros)
   * Usa fórmula de Haversine
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Verifica se duas localizações são próximas (dentro de um raio em metros)
   */
  static areLocationsNear(
    location1: PropertyLocation,
    location2: PropertyLocation,
    radiusMeters: number = 100
  ): boolean {
    if (!location1.coordinates || !location2.coordinates) {
      return false;
    }

    const distance = this.calculateDistance(
      location1.coordinates.latitude,
      location1.coordinates.longitude,
      location2.coordinates.latitude,
      location2.coordinates.longitude
    );

    return distance <= radiusMeters;
  }

  /**
   * Mock de geocodificação para desenvolvimento
   */
  private static mockGeocode(address: string): GeocodingResult | null {
    console.log('[GeocodingService] Mock geocode:', address);

    // Retorna coordenadas de Lisboa como fallback
    return {
      latitude: 38.7223,
      longitude: -9.1393,
      accuracy: 1000,
      formattedAddress: address,
      address: {
        concelho: 'Lisboa',
        distrito: 'Lisboa',
        country: 'Portugal',
      },
      geohash: this.calculateGeohash(38.7223, -9.1393),
    };
  }

  /**
   * Mock de geocodificação reversa para desenvolvimento
   */
  private static mockReverseGeocode(
    latitude: number,
    longitude: number
  ): ReverseGeocodingResult | null {
    console.log('[GeocodingService] Mock reverse geocode:', latitude, longitude);

    return {
      formattedAddress: `${latitude}, ${longitude}`,
      address: {
        concelho: 'Lisboa',
        distrito: 'Lisboa',
        country: 'Portugal',
      },
    };
  }

  /**
   * Parser para resposta de geocodificação
   * Adaptar conforme a API utilizada
   */
  private static parseGeocodingResponse(data: any): GeocodingResult | null {
    // Exemplo para Google Maps Geocoding API
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return {
      latitude: location.lat,
      longitude: location.lng,
      accuracy: this.getAccuracyFromLocationType(result.geometry.location_type),
      formattedAddress: result.formatted_address,
      address: this.parseAddressComponents(result.address_components),
      geohash: this.calculateGeohash(location.lat, location.lng),
    };
  }

  /**
   * Parser para resposta de geocodificação reversa
   */
  private static parseReverseGeocodingResponse(
    data: any
  ): ReverseGeocodingResult | null {
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];

    return {
      formattedAddress: result.formatted_address,
      address: this.parseAddressComponents(result.address_components),
    };
  }

  /**
   * Extrai componentes do endereço
   */
  private static parseAddressComponents(components: any[]): any {
    const address: any = {
      concelho: '',
      distrito: '',
      country: 'Portugal',
    };

    for (const component of components) {
      const types = component.types;

      if (types.includes('route')) {
        address.street = component.long_name;
      }
      if (types.includes('street_number')) {
        address.number = component.long_name;
      }
      if (types.includes('postal_code')) {
        address.postalCode = component.long_name;
      }
      if (types.includes('locality')) {
        address.concelho = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        address.distrito = component.long_name;
      }
      if (types.includes('sublocality')) {
        address.freguesia = component.long_name;
      }
      if (types.includes('country')) {
        address.country = component.long_name;
      }
    }

    return address;
  }

  /**
   * Converte tipo de localização em precisão (metros)
   */
  private static getAccuracyFromLocationType(locationType: string): number {
    const accuracyMap: Record<string, number> = {
      ROOFTOP: 10,
      RANGE_INTERPOLATED: 50,
      GEOMETRIC_CENTER: 100,
      APPROXIMATE: 1000,
    };

    return accuracyMap[locationType] || 1000;
  }
}
