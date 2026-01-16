/**
 * CasafariAlerts.test.ts - Unit tests for CasafariAlertsService
 */

import {
  CasafariAlertsService,
  createCasafariAlertsService,
} from '../src/services/casafari/CasafariAlertsService';
import { CasafariApiError } from '../src/services/casafari/CasafariService';
import type {
  CasafariAlertFeed,
  CasafariAlert,
  CasafariAlertsResponse,
  CasafariAlertFeedsResponse,
  CasafariAlertFeedResponse,
  CasafariCreateAlertFeedRequest,
  CasafariUpdateAlertFeedRequest,
  CasafariSearchAlertsRequest,
  CasafariAlertSubtype,
} from '../src/services/casafari/types-alerts';

// Mock fetch global
global.fetch = jest.fn();

describe('CasafariAlertsService', () => {
  let service: CasafariAlertsService;
  const mockApiKey = 'test-alerts-api-key';
  const mockBaseUrl = 'https://api.casafari.com';

  beforeEach(() => {
    service = new CasafariAlertsService({
      apiKey: mockApiKey,
      baseUrl: mockBaseUrl,
      timeout: 5000,
    });
  });

  describe('constructor', () => {
    it('should create service with provided config', () => {
      expect(service).toBeInstanceOf(CasafariAlertsService);
    });

    it('should use default baseUrl if not provided', () => {
      const defaultService = new CasafariAlertsService({
        apiKey: mockApiKey,
      });
      expect(defaultService).toBeInstanceOf(CasafariAlertsService);
    });

    it('should use default timeout if not provided', () => {
      const defaultService = new CasafariAlertsService({
        apiKey: mockApiKey,
      });
      expect(defaultService).toBeInstanceOf(CasafariAlertsService);
    });
  });

  describe('listFeeds', () => {
    const mockFeedsResponse: CasafariAlertFeedsResponse = {
      data: [
        {
          id: 'feed-1',
          name: 'Apartamentos T2 em Lisboa',
          description: 'Apartamentos de 2 quartos em Lisboa até €300k',
          filters: {
            municipality: ['Lisboa'],
            propertyType: ['apartment'],
            transactionType: 'sale',
            minBedrooms: 2,
            maxBedrooms: 2,
            maxPrice: 300000,
          },
          status: 'active',
          frequency: 'realtime',
          email: 'consultant@example.com',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-20T14:45:00Z',
          alertsCount: 42,
          userId: 'user-123',
        },
        {
          id: 'feed-2',
          name: 'Casas em Porto com Piscina',
          description: 'Casas com piscina no Porto',
          filters: {
            municipality: ['Porto'],
            propertyType: ['house'],
            transactionType: 'sale',
            hasPool: true,
            maxPrice: 500000,
          },
          status: 'paused',
          frequency: 'daily',
          email: 'consultant@example.com',
          createdAt: '2024-01-10T08:00:00Z',
          updatedAt: '2024-01-19T12:00:00Z',
          alertsCount: 28,
          userId: 'user-123',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
      meta: {
        requestId: 'req-123',
        responseTime: 150,
      },
    };

    it('should list feeds with default pagination', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedsResponse,
      });

      const result = await service.listFeeds();

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/feeds?page=1&limit=20`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Apartamentos T2 em Lisboa');
      expect(result.data[0].status).toBe('active');
      expect(result.pagination.total).toBe(2);
    });

    it('should list feeds with custom pagination', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedsResponse,
      });

      const result = await service.listFeeds(2, 50);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/feeds?page=2&limit=50`,
        expect.any(Object)
      );

      expect(result.data).toHaveLength(2);
    });

    it('should handle empty feeds list', async () => {
      const emptyResponse: CasafariAlertFeedsResponse = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => emptyResponse,
      });

      const result = await service.listFeeds();

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('createFeed', () => {
    const mockCreatedFeed: CasafariAlertFeed = {
      id: 'feed-new-1',
      name: 'Apartamentos T2 em Lisboa',
      description: 'Apartamentos de 2 quartos em Lisboa até €300k',
      filters: {
        municipality: ['Lisboa'],
        propertyType: ['apartment'],
        transactionType: 'sale',
        minBedrooms: 2,
        maxBedrooms: 2,
        maxPrice: 300000,
      },
      status: 'active',
      frequency: 'realtime',
      email: 'consultant@example.com',
      createdAt: '2024-01-22T10:30:00Z',
      updatedAt: '2024-01-22T10:30:00Z',
      alertsCount: 0,
      userId: 'user-123',
    };

    const mockFeedResponse: CasafariAlertFeedResponse = {
      data: mockCreatedFeed,
      meta: { requestId: 'req-456', responseTime: 200 },
    };

    it('should create a new feed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedResponse,
      });

      const request: CasafariCreateAlertFeedRequest = {
        name: 'Apartamentos T2 em Lisboa',
        description: 'Apartamentos de 2 quartos em Lisboa até €300k',
        filters: {
          municipality: ['Lisboa'],
          propertyType: ['apartment'],
          transactionType: 'sale',
          minBedrooms: 2,
          maxBedrooms: 2,
          maxPrice: 300000,
        },
        frequency: 'realtime',
        email: 'consultant@example.com',
        status: 'active',
      };

      const result = await service.createFeed(request);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/feeds`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(request),
        })
      );

      expect(result.id).toBe('feed-new-1');
      expect(result.name).toBe('Apartamentos T2 em Lisboa');
      expect(result.status).toBe('active');
      expect(result.alertsCount).toBe(0);
    });

    it('should create feed with minimal fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedResponse,
      });

      const request: CasafariCreateAlertFeedRequest = {
        name: 'Simple Feed',
        filters: {
          municipality: ['Lisboa'],
          propertyType: ['apartment'],
          transactionType: 'sale',
        },
      };

      const result = await service.createFeed(request);

      expect(result).toBeDefined();
      expect(result.name).toBe('Apartamentos T2 em Lisboa');
    });

    it('should handle feed creation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            code: 'INVALID_FEED',
            message: 'Invalid feed configuration',
          },
        }),
      });

      const request: CasafariCreateAlertFeedRequest = {
        name: 'Invalid Feed',
        filters: {},
      };

      await expect(service.createFeed(request)).rejects.toThrow(CasafariApiError);
    });
  });

  describe('getAlertsByFeed', () => {
    const mockAlertsResponse: CasafariAlertsResponse = {
      data: [
        {
          id: 'alert-1',
          feedId: 'feed-1',
          propertyId: 'prop-1',
          subtype: 'new_listing' as CasafariAlertSubtype,
          createdAt: '2024-01-22T10:00:00Z',
          status: 'unread',
          property: {
            id: 'prop-1',
            propertyType: 'apartment',
            transactionType: 'sale',
            location: {
              latitude: 38.7223,
              longitude: -9.1393,
              address: 'Rua da Rosa, Lisboa',
              municipality: 'Lisboa',
              district: 'Lisboa',
            },
            price: {
              current: 250000,
              currency: 'EUR',
              previous: 280000,
              change: -30000,
              changePercentage: -10.71,
            },
            characteristics: {
              netArea: 85,
              bedrooms: 2,
              bathrooms: 1,
              condition: 'used',
            },
            source: {
              portal: 'OLX',
              portalId: 'prop-olx-1',
              url: 'https://olx.pt/anuncio/...',
              agency: 'Agência XYZ',
              agentName: 'João Silva',
              publishedDate: '2024-01-22T09:00:00Z',
            },
            title: 'Apartamento T2 em Lisboa',
            description: 'Apartamento bem localizado com 2 quartos',
          },
          matchScore: 95,
        },
        {
          id: 'alert-2',
          feedId: 'feed-1',
          propertyId: 'prop-2',
          subtype: 'price_reduction' as CasafariAlertSubtype,
          createdAt: '2024-01-21T15:30:00Z',
          status: 'read',
          property: {
            id: 'prop-2',
            propertyType: 'apartment',
            transactionType: 'sale',
            location: {
              latitude: 38.7230,
              longitude: -9.1400,
              municipality: 'Lisboa',
            },
            price: {
              current: 280000,
              currency: 'EUR',
              previous: 300000,
              change: -20000,
              changePercentage: -6.67,
            },
            characteristics: {
              netArea: 95,
              bedrooms: 2,
              bathrooms: 2,
            },
            source: {
              portal: 'Idealista',
            },
            title: 'Apartamento T2 Lisboa',
          },
          changes: [
            {
              field: 'price',
              oldValue: 300000,
              newValue: 280000,
            },
          ],
          matchScore: 88,
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
      },
      summary: {
        unreadCount: 1,
        totalCount: 2,
        bySubtype: {
          new_listing: 1,
          price_reduction: 1,
        },
      },
    };

    it('should get alerts by feed with default pagination', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlertsResponse,
      });

      const result = await service.getAlertsByFeed('feed-1');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/feeds/feed-1?page=1&limit=50`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0].subtype).toBe('new_listing');
      expect(result.summary?.unreadCount).toBe(1);
    });

    it('should get alerts by feed with custom pagination', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlertsResponse,
      });

      const result = await service.getAlertsByFeed('feed-1', 2, 100);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/feeds/feed-1?page=2&limit=100`,
        expect.any(Object)
      );

      expect(result.data).toHaveLength(2);
    });

    it('should get alerts filtered by status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlertsResponse,
      });

      const result = await service.getAlertsByFeed('feed-1', 1, 50, 'unread');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/feeds/feed-1?page=1&limit=50&status=unread`,
        expect.any(Object)
      );

      expect(result.data).toHaveLength(2);
    });

    it('should handle various status filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlertsResponse,
      });

      const statuses: Array<'unread' | 'read' | 'archived' | 'dismissed'> = [
        'unread',
        'read',
        'archived',
        'dismissed',
      ];

      for (const status of statuses) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockAlertsResponse,
        });

        await service.getAlertsByFeed('feed-1', 1, 50, status);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`status=${status}`),
          expect.any(Object)
        );
      }
    });
  });

  describe('deleteFeed', () => {
    it('should delete a feed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await service.deleteFeed('feed-1');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/feeds/feed-1`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
          }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');
    });

    it('should handle delete errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: {
            code: 'FEED_NOT_FOUND',
            message: 'Feed not found',
          },
        }),
      });

      await expect(service.deleteFeed('feed-nonexistent')).rejects.toThrow(CasafariApiError);
    });
  });

  describe('searchAlerts', () => {
    const mockSearchResponse: CasafariAlertsResponse = {
      data: [
        {
          id: 'alert-1',
          feedId: 'feed-1',
          propertyId: 'prop-1',
          subtype: 'new_listing' as CasafariAlertSubtype,
          createdAt: '2024-01-22T10:00:00Z',
          status: 'unread',
          property: {
            id: 'prop-1',
            propertyType: 'apartment',
            transactionType: 'sale',
            location: {
              latitude: 38.7223,
              longitude: -9.1393,
              municipality: 'Lisboa',
            },
            price: { current: 250000, currency: 'EUR' },
            characteristics: { netArea: 85, bedrooms: 2 },
            source: { portal: 'OLX' },
            title: 'Apartamento T2 em Lisboa',
          },
          matchScore: 95,
        },
      ],
      pagination: {
        page: 1,
        limit: 100,
        total: 1,
        totalPages: 1,
      },
      summary: {
        unreadCount: 1,
        totalCount: 1,
        bySubtype: {
          new_listing: 1,
        },
      },
    };

    it('should search alerts with multiple filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const request: CasafariSearchAlertsRequest = {
        status: ['unread'],
        subtypes: ['new_listing' as CasafariAlertSubtype, 'price_reduction' as CasafariAlertSubtype],
        propertyType: ['apartment'],
        municipality: ['Lisboa'],
        maxPrice: 350000,
        limit: 100,
      };

      const result = await service.searchAlerts(request);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/search`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        })
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('unread');
    });

    it('should search alerts with date filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const request: CasafariSearchAlertsRequest = {
        createdAfter: '2024-01-01T00:00:00Z',
        createdBefore: '2024-01-31T23:59:59Z',
        limit: 50,
      };

      const result = await service.searchAlerts(request);

      expect(result).toBeDefined();
      expect(result.data.length).toBeGreaterThanOrEqual(0);
    });

    it('should search alerts with sorting', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const request: CasafariSearchAlertsRequest = {
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 100,
      };

      const result = await service.searchAlerts(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('sortBy'),
        })
      );

      expect(result).toBeDefined();
    });

    it('should search alerts with minimal filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      });

      const request: CasafariSearchAlertsRequest = {
        limit: 50,
      };

      const result = await service.searchAlerts(request);

      expect(result).toBeDefined();
    });
  });

  describe('updateFeed', () => {
    const mockUpdatedFeed: CasafariAlertFeed = {
      id: 'feed-1',
      name: 'Apartamentos T2 em Lisboa - Updated',
      filters: {
        municipality: ['Lisboa'],
        propertyType: ['apartment'],
        transactionType: 'sale',
        minBedrooms: 2,
        maxBedrooms: 3,
        maxPrice: 350000,
      },
      status: 'active',
      frequency: 'daily',
      email: 'new-email@example.com',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-22T15:00:00Z',
      alertsCount: 42,
    };

    const mockFeedResponse: CasafariAlertFeedResponse = {
      data: mockUpdatedFeed,
    };

    it('should update feed name and filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedResponse,
      });

      const request: CasafariUpdateAlertFeedRequest = {
        name: 'Apartamentos T2 em Lisboa - Updated',
        filters: {
          maxPrice: 350000,
          maxBedrooms: 3,
        },
      };

      const result = await service.updateFeed('feed-1', request);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/feeds/feed-1/update`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(request),
        })
      );

      expect(result.name).toBe('Apartamentos T2 em Lisboa - Updated');
      expect(result.filters.maxPrice).toBe(350000);
    });

    it('should update feed frequency and email', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedResponse,
      });

      const request: CasafariUpdateAlertFeedRequest = {
        frequency: 'daily',
        email: 'new-email@example.com',
      };

      const result = await service.updateFeed('feed-1', request);

      expect(result).toBeDefined();
    });

    it('should update feed metadata', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedResponse,
      });

      const request: CasafariUpdateAlertFeedRequest = {
        metadata: {
          tags: ['important', 'client-xyz'],
          lastReviewedBy: 'consultant@example.com',
        },
      };

      const result = await service.updateFeed('feed-1', request);

      expect(result).toBeDefined();
    });

    it('should handle update errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({
          error: {
            code: 'INVALID_UPDATE',
            message: 'Invalid feed update',
          },
        }),
      });

      const request: CasafariUpdateAlertFeedRequest = {
        maxPrice: -100,
      };

      await expect(service.updateFeed('feed-1', request)).rejects.toThrow(CasafariApiError);
    });
  });

  describe('getFeed', () => {
    const mockFeed: CasafariAlertFeed = {
      id: 'feed-1',
      name: 'Apartamentos T2 em Lisboa',
      description: 'Apartamentos de 2 quartos em Lisboa até €300k',
      filters: {
        municipality: ['Lisboa'],
        propertyType: ['apartment'],
        transactionType: 'sale',
        minBedrooms: 2,
        maxBedrooms: 2,
        maxPrice: 300000,
      },
      status: 'active',
      frequency: 'realtime',
      email: 'consultant@example.com',
      webhookUrl: 'https://example.com/webhooks/alerts',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:45:00Z',
      lastCheckedAt: '2024-01-22T10:00:00Z',
      alertsCount: 42,
      userId: 'user-123',
      metadata: {
        tags: ['important'],
      },
    };

    const mockFeedResponse: CasafariAlertFeedResponse = {
      data: mockFeed,
    };

    it('should get feed by ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedResponse,
      });

      const result = await service.getFeed('feed-1');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/feeds/feed-1`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
          }),
        })
      );

      expect(result.id).toBe('feed-1');
      expect(result.name).toBe('Apartamentos T2 em Lisboa');
      expect(result.alertsCount).toBe(42);
      expect(result.status).toBe('active');
    });

    it('should handle feed not found error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: {
            code: 'FEED_NOT_FOUND',
            message: 'Feed not found',
          },
        }),
      });

      await expect(service.getFeed('feed-nonexistent')).rejects.toThrow(CasafariApiError);
    });
  });

  describe('markAlertAsRead', () => {
    const mockReadAlert: CasafariAlert = {
      id: 'alert-1',
      feedId: 'feed-1',
      propertyId: 'prop-1',
      subtype: 'new_listing' as CasafariAlertSubtype,
      createdAt: '2024-01-22T10:00:00Z',
      status: 'read',
      property: {
        id: 'prop-1',
        propertyType: 'apartment',
        transactionType: 'sale',
        location: { latitude: 38.7223, longitude: -9.1393, municipality: 'Lisboa' },
        price: { current: 250000, currency: 'EUR' },
        characteristics: { netArea: 85, bedrooms: 2 },
        source: { portal: 'OLX' },
        title: 'Apartamento T2',
      },
      matchScore: 95,
    };

    it('should mark alert as read', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockReadAlert }),
      });

      const result = await service.markAlertAsRead('alert-1');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/alerts/alert-1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'read' }),
        })
      );

      expect(result.status).toBe('read');
    });

    it('should handle marking alert as read error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: {
            code: 'ALERT_NOT_FOUND',
            message: 'Alert not found',
          },
        }),
      });

      await expect(service.markAlertAsRead('alert-nonexistent')).rejects.toThrow(
        CasafariApiError
      );
    });
  });

  describe('markAlertAsArchived', () => {
    const mockArchivedAlert: CasafariAlert = {
      id: 'alert-1',
      feedId: 'feed-1',
      propertyId: 'prop-1',
      subtype: 'new_listing' as CasafariAlertSubtype,
      createdAt: '2024-01-22T10:00:00Z',
      status: 'archived',
      property: {
        id: 'prop-1',
        propertyType: 'apartment',
        transactionType: 'sale',
        location: { latitude: 38.7223, longitude: -9.1393 },
        price: { current: 250000, currency: 'EUR' },
        characteristics: { netArea: 85 },
        source: {},
        title: 'Apartamento',
      },
    };

    it('should mark alert as archived', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockArchivedAlert }),
      });

      const result = await service.markAlertAsArchived('alert-1');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/alerts/alert-1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'archived' }),
        })
      );

      expect(result.status).toBe('archived');
    });
  });

  describe('markAlertAsDismissed', () => {
    const mockDismissedAlert: CasafariAlert = {
      id: 'alert-1',
      feedId: 'feed-1',
      propertyId: 'prop-1',
      subtype: 'new_listing' as CasafariAlertSubtype,
      createdAt: '2024-01-22T10:00:00Z',
      status: 'dismissed',
      property: {
        id: 'prop-1',
        propertyType: 'apartment',
        transactionType: 'sale',
        location: {},
        price: { current: 250000, currency: 'EUR' },
        characteristics: {},
        source: {},
      },
    };

    it('should mark alert as dismissed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDismissedAlert }),
      });

      const result = await service.markAlertAsDismissed('alert-1');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/alerts/alert-1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'dismissed' }),
        })
      );

      expect(result.status).toBe('dismissed');
    });
  });

  describe('pauseFeed', () => {
    const mockPausedFeed: CasafariAlertFeed = {
      id: 'feed-1',
      name: 'Test Feed',
      filters: {},
      status: 'paused',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-22T15:00:00Z',
    };

    const mockFeedResponse: CasafariAlertFeedResponse = {
      data: mockPausedFeed,
    };

    it('should pause a feed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedResponse,
      });

      const result = await service.pauseFeed('feed-1');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/feeds/feed-1/update`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'paused' }),
        })
      );

      expect(result.status).toBe('paused');
    });

    it('should handle pause feed error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: {
            code: 'FEED_NOT_FOUND',
            message: 'Feed not found',
          },
        }),
      });

      await expect(service.pauseFeed('feed-nonexistent')).rejects.toThrow(CasafariApiError);
    });
  });

  describe('resumeFeed', () => {
    const mockActiveFeed: CasafariAlertFeed = {
      id: 'feed-1',
      name: 'Test Feed',
      filters: {},
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-22T15:00:00Z',
    };

    const mockFeedResponse: CasafariAlertFeedResponse = {
      data: mockActiveFeed,
    };

    it('should resume a paused feed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedResponse,
      });

      const result = await service.resumeFeed('feed-1');

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/feeds/feed-1/update`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'active' }),
        })
      );

      expect(result.status).toBe('active');
    });
  });

  describe('getUnreadCount', () => {
    const mockUnreadResponse: CasafariAlertsResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 1,
        total: 42,
        totalPages: 42,
      },
      summary: {
        unreadCount: 42,
        totalCount: 100,
        bySubtype: {
          new_listing: 25,
          price_reduction: 17,
        },
      },
    };

    it('should get unread alerts count', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUnreadResponse,
      });

      const count = await service.getUnreadCount();

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/listing-alerts/search`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            status: ['unread'],
            limit: 1,
          }),
        })
      );

      expect(count).toBe(42);
    });

    it('should fallback to pagination total if summary missing', async () => {
      const responseWithoutSummary: CasafariAlertsResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 1,
          total: 30,
          totalPages: 30,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithoutSummary,
      });

      const count = await service.getUnreadCount();

      expect(count).toBe(30);
    });

    it('should handle unread count error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: {
            code: 'SERVER_ERROR',
            message: 'Internal server error',
          },
        }),
      });

      await expect(service.getUnreadCount()).rejects.toThrow(CasafariApiError);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.listFeeds()).rejects.toThrow(CasafariApiError);
    });

    it('should handle timeout errors', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            const error = new Error('Abort');
            error.name = 'AbortError';
            reject(error);
          })
      );

      await expect(service.listFeeds()).rejects.toThrow(CasafariApiError);
    });

    it('should handle JSON parse errors on API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(service.listFeeds()).rejects.toThrow(CasafariApiError);
    });

    it('should handle 401 Unauthorized', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid API key',
          },
        }),
      });

      await expect(service.listFeeds()).rejects.toThrow(CasafariApiError);
    });

    it('should handle 403 Forbidden', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        }),
      });

      await expect(service.listFeeds()).rejects.toThrow(CasafariApiError);
    });

    it('should handle 429 Rate Limited', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
          },
        }),
      });

      await expect(service.listFeeds()).rejects.toThrow(CasafariApiError);
    });

    it('should handle 500 Server Error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: {
            code: 'SERVER_ERROR',
            message: 'Internal server error',
          },
        }),
      });

      await expect(service.listFeeds()).rejects.toThrow(CasafariApiError);
    });

    it('should handle error with code and details', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: {
              field: 'filters',
              reason: 'Required field missing',
            },
          },
        }),
      });

      try {
        await service.listFeeds();
        fail('Should have thrown');
      } catch (error) {
        if (error instanceof CasafariApiError) {
          // Just check that it's a CasafariApiError with details
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.details).toBeDefined();
        } else {
          fail('Should be CasafariApiError');
        }
      }
    });
  });

  describe('createCasafariAlertsService factory', () => {
    it('should create service with environment variable', () => {
      process.env.CASAFARI_API_KEY = 'env-api-key';

      const service = createCasafariAlertsService();
      expect(service).toBeInstanceOf(CasafariAlertsService);

      delete process.env.CASAFARI_API_KEY;
    });

    it('should create service with provided config', () => {
      const service = createCasafariAlertsService({
        apiKey: 'config-api-key',
        baseUrl: 'https://custom.api.com',
      });

      expect(service).toBeInstanceOf(CasafariAlertsService);
    });

    it('should prioritize config over environment variable', () => {
      process.env.CASAFARI_API_KEY = 'env-api-key';

      const service = createCasafariAlertsService({
        apiKey: 'config-api-key',
      });

      expect(service).toBeInstanceOf(CasafariAlertsService);

      delete process.env.CASAFARI_API_KEY;
    });

    it('should throw error if no API key provided', () => {
      delete process.env.CASAFARI_API_KEY;

      expect(() => createCasafariAlertsService()).toThrow(
        'Casafari API key is required'
      );
    });

    it('should accept optional timeout config', () => {
      const service = createCasafariAlertsService({
        apiKey: 'test-key',
        timeout: 10000,
      });

      expect(service).toBeInstanceOf(CasafariAlertsService);
    });

    it('should accept optional baseUrl config', () => {
      const service = createCasafariAlertsService({
        apiKey: 'test-key',
        baseUrl: 'https://staging-api.casafari.com',
      });

      expect(service).toBeInstanceOf(CasafariAlertsService);
    });
  });

  describe('multiple operations workflow', () => {
    it('should handle complete workflow: create, update, get, delete', async () => {
      const createResponse: CasafariAlertFeedResponse = {
        data: {
          id: 'feed-workflow-1',
          name: 'Workflow Feed',
          filters: { municipality: ['Lisboa'] },
          status: 'active',
          createdAt: '2024-01-22T10:00:00Z',
          updatedAt: '2024-01-22T10:00:00Z',
        },
      };

      const updateResponse: CasafariAlertFeedResponse = {
        data: {
          ...createResponse.data,
          name: 'Updated Workflow Feed',
          updatedAt: '2024-01-22T11:00:00Z',
        },
      };

      // Create
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createResponse,
      });

      const createdFeed = await service.createFeed({
        name: 'Workflow Feed',
        filters: { municipality: ['Lisboa'] },
      });

      expect(createdFeed.id).toEqual('feed-workflow-1');

      // Update
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updateResponse,
      });

      const updatedFeed = await service.updateFeed('feed-workflow-1', {
        name: 'Updated Workflow Feed',
      });

      expect(updatedFeed.name).toEqual('Updated Workflow Feed');

      // Get
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updateResponse,
      });

      const retrievedFeed = await service.getFeed('feed-workflow-1');

      expect(retrievedFeed.name).toEqual('Updated Workflow Feed');

      // Delete
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const deleteResult = await service.deleteFeed('feed-workflow-1');

      expect(deleteResult.success).toBe(true);
    });
  });

  describe('API header and encoding', () => {
    it('should include correct headers in all requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
      });

      await service.listFeeds();

      const calls = (global.fetch as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      const options = lastCall[1];

      expect(options.headers).toEqual({
        'Authorization': `Bearer ${mockApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });
    });

    it('should properly encode request body as JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 'feed-1',
            name: 'Test',
            filters: {},
            status: 'active',
            createdAt: '2024-01-22T10:00:00Z',
            updatedAt: '2024-01-22T10:00:00Z',
          },
        }),
      });

      const request: CasafariCreateAlertFeedRequest = {
        name: 'Test Feed',
        filters: {
          municipality: ['Lisboa'],
          propertyType: ['apartment'],
        },
      };

      await service.createFeed(request);

      const calls = (global.fetch as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      const body = lastCall[1].body;

      expect(body).toBe(JSON.stringify(request));
      expect(() => JSON.parse(body)).not.toThrow();
    });
  });
});
