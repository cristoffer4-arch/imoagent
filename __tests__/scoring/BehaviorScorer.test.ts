/**
 * BehaviorScorer.test.ts - Testes para o scorer de comportamento
 */

import { BehaviorScorer } from '../../src/services/scoring/BehaviorScorer';
import { UserBehavior } from '../../src/types/scoring';

describe('BehaviorScorer', () => {
  let scorer: BehaviorScorer;

  beforeEach(() => {
    scorer = new BehaviorScorer();
  });

  describe('No Behavior Data', () => {
    it('should return neutral score when no behavior', () => {
      const score = scorer.calculate(undefined);

      expect(score.total).toBe(50);
      expect(score.reasons).toContain('Propriedade ainda não visualizada');
    });
  });

  describe('View Frequency Score', () => {
    it('should give high score for multiple views', () => {
      const behavior: UserBehavior = {
        userId: 'user-123',
        propertyId: 'prop-123',
        viewCount: 5,
        totalViewTimeSeconds: 300,
        averageViewTimeSeconds: 60,
        lastViewedAt: new Date(),
        firstViewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actions: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const score = scorer.calculate(behavior);

      expect(score.breakdown.viewFrequency).toBeGreaterThan(25);
    });

    it('should give lower score for single view', () => {
      const behavior: UserBehavior = {
        userId: 'user-123',
        propertyId: 'prop-123',
        viewCount: 1,
        totalViewTimeSeconds: 60,
        averageViewTimeSeconds: 60,
        lastViewedAt: new Date(),
        firstViewedAt: new Date(),
        actions: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const score = scorer.calculate(behavior);

      expect(score.breakdown.viewFrequency).toBe(10);
    });
  });

  describe('View Duration Score', () => {
    it('should give high score for good duration', () => {
      const behavior: UserBehavior = {
        userId: 'user-123',
        propertyId: 'prop-123',
        viewCount: 3,
        totalViewTimeSeconds: 360,
        averageViewTimeSeconds: 120,
        lastViewedAt: new Date(),
        firstViewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actions: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const score = scorer.calculate(behavior);

      expect(score.breakdown.viewDuration).toBeGreaterThan(20);
    });

    it('should give lower score for very short views', () => {
      const behavior: UserBehavior = {
        userId: 'user-123',
        propertyId: 'prop-123',
        viewCount: 2,
        totalViewTimeSeconds: 20,
        averageViewTimeSeconds: 10,
        lastViewedAt: new Date(),
        firstViewedAt: new Date(),
        actions: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const score = scorer.calculate(behavior);

      expect(score.breakdown.viewDuration).toBeLessThan(15);
    });
  });

  describe('Interactions Score', () => {
    it('should give high score for scheduled visit', () => {
      const behavior: UserBehavior = {
        userId: 'user-123',
        propertyId: 'prop-123',
        viewCount: 2,
        totalViewTimeSeconds: 180,
        averageViewTimeSeconds: 90,
        lastViewedAt: new Date(),
        firstViewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actions: {
          scheduled: true,
          saved: true,
        },
        imagesViewed: 10,
        detailsExpanded: true,
        mapViewed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const score = scorer.calculate(behavior);

      expect(score.breakdown.interactions).toBeGreaterThanOrEqual(30);
    });

    it('should give lower score for no interactions', () => {
      const behavior: UserBehavior = {
        userId: 'user-123',
        propertyId: 'prop-123',
        viewCount: 1,
        totalViewTimeSeconds: 60,
        averageViewTimeSeconds: 60,
        lastViewedAt: new Date(),
        firstViewedAt: new Date(),
        actions: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const score = scorer.calculate(behavior);

      expect(score.breakdown.interactions).toBeLessThan(10);
    });
  });

  describe('Recency Multiplier', () => {
    it('should return 1.0 for recent views', () => {
      const behavior: UserBehavior = {
        userId: 'user-123',
        propertyId: 'prop-123',
        viewCount: 2,
        totalViewTimeSeconds: 180,
        averageViewTimeSeconds: 90,
        lastViewedAt: new Date(),
        firstViewedAt: new Date(),
        actions: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const multiplier = scorer.calculateRecencyMultiplier(behavior);

      expect(multiplier).toBe(1.0);
    });

    it('should return lower multiplier for old views', () => {
      const behavior: UserBehavior = {
        userId: 'user-123',
        propertyId: 'prop-123',
        viewCount: 2,
        totalViewTimeSeconds: 180,
        averageViewTimeSeconds: 90,
        lastViewedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
        firstViewedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        actions: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const multiplier = scorer.calculateRecencyMultiplier(behavior);

      expect(multiplier).toBeLessThan(0.5);
    });
  });

  describe('Total Score', () => {
    it('should calculate comprehensive score correctly', () => {
      const behavior: UserBehavior = {
        userId: 'user-123',
        propertyId: 'prop-123',
        viewCount: 3,
        totalViewTimeSeconds: 300,
        averageViewTimeSeconds: 100,
        lastViewedAt: new Date(),
        firstViewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actions: {
          contacted: true,
          saved: true,
        },
        imagesViewed: 8,
        detailsExpanded: true,
        mapViewed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const score = scorer.calculate(behavior);

      expect(score.total).toBeGreaterThan(60);
      expect(score.total).toBeLessThanOrEqual(100);
      expect(score.reasons.length).toBeGreaterThan(0);
    });
  });
});
