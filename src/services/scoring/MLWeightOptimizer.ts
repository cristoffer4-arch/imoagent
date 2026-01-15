/**
 * MLWeightOptimizer - Machine Learning for dynamic weight adjustment
 * 
 * Uses simple feedback-based learning to optimize scoring weights
 * based on user outcomes (conversions, contacts, views)
 */

import { ScoreWeights, ScoreComponents, MLModelState } from './types';

/**
 * User outcome after viewing a property
 */
export type UserOutcome = 'converted' | 'contacted' | 'viewed' | 'ignored';

/**
 * Training sample for ML model
 */
export interface TrainingSample {
  propertyId: string;
  features: ScoreComponents;
  outcome: UserOutcome;
  timestamp: Date;
}

/**
 * Outcome weights (how valuable each outcome is)
 */
const OUTCOME_VALUES: Record<UserOutcome, number> = {
  converted: 1.0, // Best outcome
  contacted: 0.7, // Good outcome
  viewed: 0.3, // Neutral outcome
  ignored: 0.0, // Worst outcome
};

/**
 * MLWeightOptimizer for dynamic weight adjustment
 */
export class MLWeightOptimizer {
  private modelState: MLModelState;
  private learningRate: number;
  private minSamples: number;

  constructor(
    initialWeights?: ScoreWeights,
    learningRate: number = 0.01,
    minSamples: number = 50
  ) {
    this.modelState = {
      weights: initialWeights || {
        compatibility: 0.4,
        behavior: 0.3,
        temporal: 0.3,
      },
      trainingData: [],
    };
    this.learningRate = learningRate;
    this.minSamples = minSamples;
  }

  /**
   * Add a training sample
   */
  public addTrainingSample(sample: TrainingSample): void {
    this.modelState.trainingData.push(sample);

    // Auto-train when we have enough samples
    if (this.modelState.trainingData.length >= this.minSamples &&
        this.modelState.trainingData.length % 10 === 0) {
      this.train();
    }
  }

  /**
   * Train the model to optimize weights
   * Uses gradient descent to minimize prediction error
   */
  public train(): void {
    const data = this.modelState.trainingData;
    
    if (data.length < this.minSamples) {
      console.log(`Not enough samples for training. Need ${this.minSamples}, have ${data.length}`);
      return;
    }

    console.log(`Training ML model with ${data.length} samples...`);

    // Calculate gradients for each weight component
    const gradients = {
      compatibility: 0,
      behavior: 0,
      temporal: 0,
    };

    let totalError = 0;

    for (const sample of data) {
      // Calculate predicted score with current weights
      const predictedScore = 
        this.modelState.weights.compatibility * sample.features.compatibilityScore +
        this.modelState.weights.behavior * sample.features.behaviorScore +
        this.modelState.weights.temporal * sample.features.temporalScore;

      // Convert outcome to target score (0-100)
      const targetScore = OUTCOME_VALUES[sample.outcome] * 100;

      // Calculate error
      const error = predictedScore - targetScore;
      totalError += Math.abs(error);

      // Calculate gradients (partial derivatives)
      gradients.compatibility += error * sample.features.compatibilityScore;
      gradients.behavior += error * sample.features.behaviorScore;
      gradients.temporal += error * sample.features.temporalScore;
    }

    // Average gradients
    const n = data.length;
    gradients.compatibility /= n;
    gradients.behavior /= n;
    gradients.temporal /= n;

    // Update weights using gradient descent
    let newWeights = {
      compatibility: this.modelState.weights.compatibility - this.learningRate * gradients.compatibility,
      behavior: this.modelState.weights.behavior - this.learningRate * gradients.behavior,
      temporal: this.modelState.weights.temporal - this.learningRate * gradients.temporal,
    };

    // Ensure weights are positive
    newWeights.compatibility = Math.max(0.1, newWeights.compatibility);
    newWeights.behavior = Math.max(0.1, newWeights.behavior);
    newWeights.temporal = Math.max(0.1, newWeights.temporal);

    // Normalize weights to sum to 1.0
    const sum = newWeights.compatibility + newWeights.behavior + newWeights.temporal;
    newWeights = {
      compatibility: newWeights.compatibility / sum,
      behavior: newWeights.behavior / sum,
      temporal: newWeights.temporal / sum,
    };

    // Update model state
    this.modelState.weights = newWeights;
    this.modelState.lastTrainedAt = new Date();
    this.modelState.accuracy = 1 - (totalError / (n * 100)); // Normalize accuracy to 0-1

    console.log('Training complete. New weights:', newWeights);
    console.log('Model accuracy:', this.modelState.accuracy);
  }

  /**
   * Evaluate model performance on training data
   */
  public evaluate(): {
    accuracy: number;
    avgError: number;
    sampleCount: number;
    weights: ScoreWeights;
  } {
    const data = this.modelState.trainingData;
    
    if (data.length === 0) {
      return {
        accuracy: 0,
        avgError: 0,
        sampleCount: 0,
        weights: this.modelState.weights,
      };
    }

    let totalError = 0;
    let correctPredictions = 0;

    for (const sample of data) {
      const predictedScore = 
        this.modelState.weights.compatibility * sample.features.compatibilityScore +
        this.modelState.weights.behavior * sample.features.behaviorScore +
        this.modelState.weights.temporal * sample.features.temporalScore;

      const targetScore = OUTCOME_VALUES[sample.outcome] * 100;
      const error = Math.abs(predictedScore - targetScore);
      totalError += error;

      // Consider prediction correct if within 20 points
      if (error < 20) {
        correctPredictions++;
      }
    }

    return {
      accuracy: correctPredictions / data.length,
      avgError: totalError / data.length,
      sampleCount: data.length,
      weights: this.modelState.weights,
    };
  }

  /**
   * Get optimized weights
   */
  public getOptimizedWeights(): ScoreWeights {
    return { ...this.modelState.weights };
  }

  /**
   * Get full model state
   */
  public getModelState(): MLModelState {
    return { ...this.modelState };
  }

  /**
   * Load model state (for persistence)
   */
  public loadModelState(state: MLModelState): void {
    this.modelState = state;
  }

  /**
   * Reset model to initial state
   */
  public reset(initialWeights?: ScoreWeights): void {
    this.modelState = {
      weights: initialWeights || {
        compatibility: 0.4,
        behavior: 0.3,
        temporal: 0.3,
      },
      trainingData: [],
    };
  }

  /**
   * Get feature importance (which scores matter most)
   */
  public getFeatureImportance(): {
    compatibility: number;
    behavior: number;
    temporal: number;
  } {
    // Feature importance is directly proportional to weights
    return { ...this.modelState.weights };
  }

  /**
   * A/B test two weight configurations
   */
  public static async abTest(
    weightsA: ScoreWeights,
    weightsB: ScoreWeights,
    testSamples: TrainingSample[]
  ): Promise<{
    winnerWeights: ScoreWeights;
    winner: 'A' | 'B' | 'tie';
    scoreA: number;
    scoreB: number;
  }> {
    // Create two optimizers with different weights
    const optimizerA = new MLWeightOptimizer(weightsA);
    const optimizerB = new MLWeightOptimizer(weightsB);

    // Add samples to both
    testSamples.forEach((sample) => {
      optimizerA.addTrainingSample(sample);
      optimizerB.addTrainingSample(sample);
    });

    // Evaluate both
    const evalA = optimizerA.evaluate();
    const evalB = optimizerB.evaluate();

    let winner: 'A' | 'B' | 'tie';
    if (Math.abs(evalA.accuracy - evalB.accuracy) < 0.05) {
      winner = 'tie';
    } else if (evalA.accuracy > evalB.accuracy) {
      winner = 'A';
    } else {
      winner = 'B';
    }

    return {
      winnerWeights: winner === 'B' ? weightsB : weightsA,
      winner,
      scoreA: evalA.accuracy,
      scoreB: evalB.accuracy,
    };
  }

  /**
   * Suggest weight adjustments based on outcome distribution
   */
  public suggestWeightAdjustments(): {
    current: ScoreWeights;
    suggested: ScoreWeights;
    rationale: string;
  } {
    const data = this.modelState.trainingData;
    
    if (data.length < this.minSamples) {
      return {
        current: this.modelState.weights,
        suggested: this.modelState.weights,
        rationale: 'Insufficient data for suggestions',
      };
    }

    // Analyze which features correlate with good outcomes
    const correlations = {
      compatibility: 0,
      behavior: 0,
      temporal: 0,
    };

    const goodOutcomes = data.filter(
      (s) => s.outcome === 'converted' || s.outcome === 'contacted'
    );

    if (goodOutcomes.length > 0) {
      goodOutcomes.forEach((sample) => {
        correlations.compatibility += sample.features.compatibilityScore;
        correlations.behavior += sample.features.behaviorScore;
        correlations.temporal += sample.features.temporalScore;
      });

      // Normalize
      const total = correlations.compatibility + correlations.behavior + correlations.temporal;
      correlations.compatibility /= total;
      correlations.behavior /= total;
      correlations.temporal /= total;
    }

    // Suggest weights based on correlations
    const suggested = {
      compatibility: Math.round(correlations.compatibility * 100) / 100,
      behavior: Math.round(correlations.behavior * 100) / 100,
      temporal: Math.round(correlations.temporal * 100) / 100,
    };

    // Normalize to sum to 1.0
    const sum = suggested.compatibility + suggested.behavior + suggested.temporal;
    suggested.compatibility /= sum;
    suggested.behavior /= sum;
    suggested.temporal /= sum;

    let rationale = 'Based on successful conversions, ';
    const maxWeight = Math.max(suggested.compatibility, suggested.behavior, suggested.temporal);
    if (maxWeight === suggested.compatibility) {
      rationale += 'compatibility factors are most important.';
    } else if (maxWeight === suggested.behavior) {
      rationale += 'user behavior signals are most important.';
    } else {
      rationale += 'timing and urgency factors are most important.';
    }

    return {
      current: this.modelState.weights,
      suggested,
      rationale,
    };
  }
}
