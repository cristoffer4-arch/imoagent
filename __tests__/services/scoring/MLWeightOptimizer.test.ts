/**
 * Tests for MLWeightOptimizer
 */

import { MLWeightOptimizer, TrainingSample } from '@/services/scoring/MLWeightOptimizer';
import { ScoreComponents, ScoreWeights } from '@/services/scoring/types';

describe('MLWeightOptimizer', () => {
  let optimizer: MLWeightOptimizer;

  beforeEach(() => {
    optimizer = new MLWeightOptimizer();
  });

  describe('Initialization', () => {
    it('should initialize with default weights', () => {
      const weights = optimizer.getOptimizedWeights();
      
      expect(weights.compatibility).toBe(0.4);
      expect(weights.behavior).toBe(0.3);
      expect(weights.temporal).toBe(0.3);
    });

    it('should allow custom initial weights', () => {
      const customWeights: ScoreWeights = {
        compatibility: 0.5,
        behavior: 0.3,
        temporal: 0.2,
      };
      
      const customOptimizer = new MLWeightOptimizer(customWeights);
      const weights = customOptimizer.getOptimizedWeights();
      
      expect(weights).toEqual(customWeights);
    });

    it('should allow custom learning rate', () => {
      const customOptimizer = new MLWeightOptimizer(undefined, 0.05, 10);
      expect(customOptimizer).toBeDefined();
    });
  });

  describe('addTrainingSample', () => {
    it('should add training samples', () => {
      const sample: TrainingSample = {
        propertyId: 'prop-1',
        features: {
          compatibilityScore: 80,
          behaviorScore: 70,
          temporalScore: 60,
        },
        outcome: 'contacted',
        timestamp: new Date(),
      };
      
      optimizer.addTrainingSample(sample);
      
      const state = optimizer.getModelState();
      expect(state.trainingData.length).toBe(1);
    });

    it('should accumulate multiple samples', () => {
      for (let i = 0; i < 5; i++) {
        optimizer.addTrainingSample({
          propertyId: `prop-${i}`,
          features: {
            compatibilityScore: 80,
            behaviorScore: 70,
            temporalScore: 60,
          },
          outcome: 'viewed',
          timestamp: new Date(),
        });
      }
      
      const state = optimizer.getModelState();
      expect(state.trainingData.length).toBe(5);
    });
  });

  describe('train', () => {
    it('should not train with insufficient samples', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Add only 10 samples (minSamples default is 50)
      for (let i = 0; i < 10; i++) {
        optimizer.addTrainingSample({
          propertyId: `prop-${i}`,
          features: {
            compatibilityScore: 80,
            behaviorScore: 70,
            temporalScore: 60,
          },
          outcome: 'viewed',
          timestamp: new Date(),
        });
      }
      
      optimizer.train();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Not enough samples'));
      consoleSpy.mockRestore();
    });

    it('should train and update weights with sufficient samples', () => {
      // Add 50 samples with pattern: high compatibility leads to conversion
      for (let i = 0; i < 50; i++) {
        optimizer.addTrainingSample({
          propertyId: `prop-${i}`,
          features: {
            compatibilityScore: 90,
            behaviorScore: 50,
            temporalScore: 50,
          },
          outcome: i < 40 ? 'converted' : 'viewed',
          timestamp: new Date(),
        });
      }
      
      const initialWeights = optimizer.getOptimizedWeights();
      optimizer.train();
      const trainedWeights = optimizer.getOptimizedWeights();
      
      // Weights should have changed after training
      const weightsChanged = 
        initialWeights.compatibility !== trainedWeights.compatibility ||
        initialWeights.behavior !== trainedWeights.behavior ||
        initialWeights.temporal !== trainedWeights.temporal;
      
      expect(weightsChanged).toBe(true);
    });

    it('should update lastTrainedAt timestamp', () => {
      // Add sufficient samples
      for (let i = 0; i < 50; i++) {
        optimizer.addTrainingSample({
          propertyId: `prop-${i}`,
          features: {
            compatibilityScore: 80,
            behaviorScore: 70,
            temporalScore: 60,
          },
          outcome: 'contacted',
          timestamp: new Date(),
        });
      }
      
      optimizer.train();
      
      const state = optimizer.getModelState();
      expect(state.lastTrainedAt).toBeDefined();
      expect(state.lastTrainedAt).toBeInstanceOf(Date);
    });

    it('should calculate and store accuracy', () => {
      // Add samples
      for (let i = 0; i < 50; i++) {
        optimizer.addTrainingSample({
          propertyId: `prop-${i}`,
          features: {
            compatibilityScore: 80,
            behaviorScore: 70,
            temporalScore: 60,
          },
          outcome: 'contacted',
          timestamp: new Date(),
        });
      }
      
      optimizer.train();
      
      const state = optimizer.getModelState();
      expect(state.accuracy).toBeDefined();
      expect(state.accuracy).toBeGreaterThanOrEqual(0);
      expect(state.accuracy).toBeLessThanOrEqual(1);
    });

    it('should ensure weights sum to 1.0', () => {
      for (let i = 0; i < 50; i++) {
        optimizer.addTrainingSample({
          propertyId: `prop-${i}`,
          features: {
            compatibilityScore: 75 + Math.random() * 25,
            behaviorScore: 50 + Math.random() * 50,
            temporalScore: 40 + Math.random() * 60,
          },
          outcome: ['converted', 'contacted', 'viewed', 'ignored'][Math.floor(Math.random() * 4)] as any,
          timestamp: new Date(),
        });
      }
      
      optimizer.train();
      const weights = optimizer.getOptimizedWeights();
      
      const sum = weights.compatibility + weights.behavior + weights.temporal;
      expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
    });

    it('should ensure weights are positive', () => {
      for (let i = 0; i < 50; i++) {
        optimizer.addTrainingSample({
          propertyId: `prop-${i}`,
          features: {
            compatibilityScore: 50,
            behaviorScore: 50,
            temporalScore: 50,
          },
          outcome: 'ignored',
          timestamp: new Date(),
        });
      }
      
      optimizer.train();
      const weights = optimizer.getOptimizedWeights();
      
      expect(weights.compatibility).toBeGreaterThan(0);
      expect(weights.behavior).toBeGreaterThan(0);
      expect(weights.temporal).toBeGreaterThan(0);
    });
  });

  describe('evaluate', () => {
    it('should return zero metrics for no samples', () => {
      const evaluation = optimizer.evaluate();
      
      expect(evaluation.accuracy).toBe(0);
      expect(evaluation.avgError).toBe(0);
      expect(evaluation.sampleCount).toBe(0);
    });

    it('should evaluate model performance', () => {
      for (let i = 0; i < 30; i++) {
        optimizer.addTrainingSample({
          propertyId: `prop-${i}`,
          features: {
            compatibilityScore: 80,
            behaviorScore: 70,
            temporalScore: 60,
          },
          outcome: 'contacted',
          timestamp: new Date(),
        });
      }
      
      const evaluation = optimizer.evaluate();
      
      expect(evaluation.sampleCount).toBe(30);
      expect(evaluation.avgError).toBeGreaterThanOrEqual(0);
      expect(evaluation.accuracy).toBeGreaterThanOrEqual(0);
      expect(evaluation.weights).toBeDefined();
    });
  });

  describe('getFeatureImportance', () => {
    it('should return feature importance based on weights', () => {
      const importance = optimizer.getFeatureImportance();
      
      expect(importance.compatibility).toBe(0.4);
      expect(importance.behavior).toBe(0.3);
      expect(importance.temporal).toBe(0.3);
    });

    it('should reflect trained weights', () => {
      for (let i = 0; i < 50; i++) {
        optimizer.addTrainingSample({
          propertyId: `prop-${i}`,
          features: {
            compatibilityScore: 90,
            behaviorScore: 50,
            temporalScore: 50,
          },
          outcome: 'converted',
          timestamp: new Date(),
        });
      }
      
      optimizer.train();
      const importance = optimizer.getFeatureImportance();
      const weights = optimizer.getOptimizedWeights();
      
      expect(importance).toEqual(weights);
    });
  });

  describe('suggestWeightAdjustments', () => {
    it('should provide suggestion with insufficient data', () => {
      const suggestion = optimizer.suggestWeightAdjustments();
      
      expect(suggestion.current).toBeDefined();
      expect(suggestion.suggested).toBeDefined();
      expect(suggestion.rationale).toContain('Insufficient data');
    });

    it('should suggest weight adjustments based on successful outcomes', () => {
      // Add samples where high compatibility leads to conversions
      for (let i = 0; i < 50; i++) {
        optimizer.addTrainingSample({
          propertyId: `prop-${i}`,
          features: {
            compatibilityScore: 90,
            behaviorScore: 50,
            temporalScore: 40,
          },
          outcome: 'converted',
          timestamp: new Date(),
        });
      }
      
      const suggestion = optimizer.suggestWeightAdjustments();
      
      expect(suggestion.suggested).toBeDefined();
      expect(suggestion.rationale).toBeDefined();
      
      // Suggested weights should sum to 1.0
      const sum = suggestion.suggested.compatibility + 
                  suggestion.suggested.behavior + 
                  suggestion.suggested.temporal;
      expect(Math.abs(sum - 1.0)).toBeLessThan(0.001);
    });
  });

  describe('reset', () => {
    it('should reset to default state', () => {
      // Add samples and train
      for (let i = 0; i < 50; i++) {
        optimizer.addTrainingSample({
          propertyId: `prop-${i}`,
          features: {
            compatibilityScore: 80,
            behaviorScore: 70,
            temporalScore: 60,
          },
          outcome: 'contacted',
          timestamp: new Date(),
        });
      }
      optimizer.train();
      
      // Reset
      optimizer.reset();
      
      const state = optimizer.getModelState();
      expect(state.trainingData.length).toBe(0);
      expect(state.lastTrainedAt).toBeUndefined();
      
      const weights = optimizer.getOptimizedWeights();
      expect(weights.compatibility).toBe(0.4);
      expect(weights.behavior).toBe(0.3);
      expect(weights.temporal).toBe(0.3);
    });

    it('should reset to custom weights', () => {
      const customWeights: ScoreWeights = {
        compatibility: 0.6,
        behavior: 0.2,
        temporal: 0.2,
      };
      
      optimizer.reset(customWeights);
      
      const weights = optimizer.getOptimizedWeights();
      expect(weights).toEqual(customWeights);
    });
  });

  describe('loadModelState', () => {
    it('should load model state', () => {
      const savedState = {
        weights: {
          compatibility: 0.5,
          behavior: 0.3,
          temporal: 0.2,
        },
        trainingData: [
          {
            propertyId: 'prop-1',
            features: {
              compatibilityScore: 80,
              behaviorScore: 70,
              temporalScore: 60,
            },
            outcome: 'converted' as const,
            timestamp: new Date(),
          },
        ],
        lastTrainedAt: new Date(),
        accuracy: 0.85,
      };
      
      optimizer.loadModelState(savedState);
      
      const loadedState = optimizer.getModelState();
      expect(loadedState.weights).toEqual(savedState.weights);
      expect(loadedState.trainingData.length).toBe(1);
    });
  });

  describe('abTest', () => {
    it('should compare two weight configurations', async () => {
      const weightsA: ScoreWeights = {
        compatibility: 0.5,
        behavior: 0.3,
        temporal: 0.2,
      };
      
      const weightsB: ScoreWeights = {
        compatibility: 0.3,
        behavior: 0.4,
        temporal: 0.3,
      };
      
      const testSamples: TrainingSample[] = Array(60).fill(null).map((_, i) => ({
        propertyId: `prop-${i}`,
        features: {
          compatibilityScore: 70 + Math.random() * 30,
          behaviorScore: 60 + Math.random() * 40,
          temporalScore: 50 + Math.random() * 50,
        },
        outcome: ['converted', 'contacted', 'viewed'][Math.floor(Math.random() * 3)] as any,
        timestamp: new Date(),
      }));
      
      const result = await MLWeightOptimizer.abTest(weightsA, weightsB, testSamples);
      
      expect(result.winner).toBeDefined();
      expect(['A', 'B', 'tie']).toContain(result.winner);
      expect(result.scoreA).toBeGreaterThanOrEqual(0);
      expect(result.scoreB).toBeGreaterThanOrEqual(0);
      expect(result.winnerWeights).toBeDefined();
    });

    it('should identify tie when scores are close', async () => {
      const weightsA: ScoreWeights = {
        compatibility: 0.4,
        behavior: 0.3,
        temporal: 0.3,
      };
      
      const weightsB: ScoreWeights = {
        compatibility: 0.4,
        behavior: 0.3,
        temporal: 0.3,
      };
      
      const testSamples: TrainingSample[] = Array(60).fill(null).map((_, i) => ({
        propertyId: `prop-${i}`,
        features: {
          compatibilityScore: 75,
          behaviorScore: 65,
          temporalScore: 55,
        },
        outcome: 'contacted',
        timestamp: new Date(),
      }));
      
      const result = await MLWeightOptimizer.abTest(weightsA, weightsB, testSamples);
      
      // With identical weights and data, should be a tie or very close
      expect(Math.abs(result.scoreA - result.scoreB)).toBeLessThan(0.1);
    });
  });
});
