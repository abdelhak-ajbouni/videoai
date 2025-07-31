import Replicate from "replicate";
import { RetryManager, RetryOptions } from "./retryManager";
import { defaultPerformanceMonitor } from "../services/performanceMonitor";
import { ReplicateErrorHandler, ReplicateError, ReplicateErrorType } from "./replicateErrors";

/**
 * Interface for Replicate prediction parameters
 */
export interface PredictionParams {
  model: string;
  input: Record<string, any>;
  webhook?: string;
  webhook_events_filter?: string[];
  stream?: boolean;
}

/**
 * Interface for Replicate prediction response
 */
export interface Prediction {
  id: string;
  model: string;
  version: string;
  input: Record<string, any>;
  output?: any;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  error?: string;
  logs?: string[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
  urls: {
    get: string;
    cancel: string;
  };
  webhook?: string;
  webhook_events_filter?: string[];
}

/**
 * Interface for Replicate model response
 */
export interface Model {
  owner: string;
  name: string;
  description?: string;
  visibility: 'public' | 'private';
  github_url?: string;
  paper_url?: string;
  license_url?: string;
  cover_image_url?: string;
  default_example?: any;
  latest_version?: {
    id: string;
    created_at: string;
    cog_version: string;
    openapi_schema?: any;
  };
}

/**
 * Interface for model list response
 */
export interface ModelList {
  results: Model[];
  next?: string;
  previous?: string;
}

/**
 * Enhanced Replicate client with retry logic and performance monitoring
 */
export class EnhancedReplicateClient {
  private client: Replicate;
  private retryManager: RetryManager;
  private ctx?: any; // Convex context for performance monitoring

  constructor(apiToken: string, ctx?: any) {
    this.client = new Replicate({ auth: apiToken });
    this.retryManager = new RetryManager();
    this.ctx = ctx;
  }

  /**
   * Create a new prediction with retry logic and performance monitoring
   */
  async createPrediction(params: PredictionParams): Promise<Prediction> {
    const operation = 'create_prediction';
    const startTime = Date.now();

    try {
      const result = await this.retryManager.execute(async () => {
        return await this.client.predictions.create({
          model: params.model,
          input: params.input,
          webhook: params.webhook,
          webhook_events_filter: params.webhook_events_filter,
          stream: params.stream,
        });
      }, this.getRetryOptionsForOperation(operation));

      // Record success metrics
      const duration = Date.now() - startTime;
      if (this.ctx) {
        await defaultPerformanceMonitor.recordSuccess(
          this.ctx,
          params.model,
          operation,
          duration,
          {
            predictionId: result.id,
            inputKeys: Object.keys(params.input),
            hasWebhook: !!params.webhook,
          }
        );
      }

      return result as Prediction;
    } catch (error) {
      // Record failure metrics
      const duration = Date.now() - startTime;
      if (this.ctx) {
        await defaultPerformanceMonitor.recordFailure(
          this.ctx,
          params.model,
          operation,
          error,
          duration,
          {
            inputKeys: Object.keys(params.input),
            hasWebhook: !!params.webhook,
          }
        );
      }

      // Enhance error with classification
      const replicateError = ReplicateError.from(error);
      ReplicateErrorHandler.logError(error, {
        operation,
        model: params.model,
        duration,
      });

      throw replicateError;
    }
  }

  /**
   * Get a prediction by ID with retry logic and performance monitoring
   */
  async getPrediction(id: string): Promise<Prediction> {
    const operation = 'get_prediction';
    const startTime = Date.now();

    try {
      const result = await this.retryManager.execute(async () => {
        return await this.client.predictions.get(id);
      }, this.getRetryOptionsForOperation(operation));

      // Record success metrics
      const duration = Date.now() - startTime;
      if (this.ctx) {
        await defaultPerformanceMonitor.recordSuccess(
          this.ctx,
          result.model || 'unknown',
          operation,
          duration,
          {
            predictionId: id,
            status: result.status,
          }
        );
      }

      return result as Prediction;
    } catch (error) {
      // Record failure metrics
      const duration = Date.now() - startTime;
      if (this.ctx) {
        await defaultPerformanceMonitor.recordFailure(
          this.ctx,
          'unknown', // We don't know the model for failed gets
          operation,
          error,
          duration,
          {
            predictionId: id,
          }
        );
      }

      // Enhance error with classification
      const replicateError = ReplicateError.from(error);
      ReplicateErrorHandler.logError(error, {
        operation,
        predictionId: id,
        duration,
      });

      throw replicateError;
    }
  }

  /**
   * Cancel a prediction with retry logic
   */
  async cancelPrediction(id: string): Promise<Prediction> {
    const operation = 'cancel_prediction';
    const startTime = Date.now();

    try {
      const result = await this.retryManager.execute(async () => {
        return await this.client.predictions.cancel(id);
      }, this.getRetryOptionsForOperation(operation));

      // Record success metrics
      const duration = Date.now() - startTime;
      if (this.ctx) {
        await defaultPerformanceMonitor.recordSuccess(
          this.ctx,
          result.model || 'unknown',
          operation,
          duration,
          {
            predictionId: id,
          }
        );
      }

      return result as Prediction;
    } catch (error) {
      // Record failure metrics
      const duration = Date.now() - startTime;
      if (this.ctx) {
        await defaultPerformanceMonitor.recordFailure(
          this.ctx,
          'unknown',
          operation,
          error,
          duration,
          {
            predictionId: id,
          }
        );
      }

      const replicateError = ReplicateError.from(error);
      ReplicateErrorHandler.logError(error, {
        operation,
        predictionId: id,
        duration,
      });

      throw replicateError;
    }
  }

  /**
   * List models with retry logic and performance monitoring
   */
  async listModels(cursor?: string): Promise<ModelList> {
    const operation = 'list_models';
    const startTime = Date.now();

    try {
      const result = await this.retryManager.execute(async () => {
        return await this.client.models.list({ cursor });
      }, this.getRetryOptionsForOperation(operation));

      // Record success metrics
      const duration = Date.now() - startTime;
      if (this.ctx) {
        await defaultPerformanceMonitor.recordSuccess(
          this.ctx,
          'system', // System operation, not model-specific
          operation,
          duration,
          {
            cursor,
            resultCount: result.results?.length || 0,
          }
        );
      }

      return result as ModelList;
    } catch (error) {
      // Record failure metrics
      const duration = Date.now() - startTime;
      if (this.ctx) {
        await defaultPerformanceMonitor.recordFailure(
          this.ctx,
          'system',
          operation,
          error,
          duration,
          {
            cursor,
          }
        );
      }

      const replicateError = ReplicateError.from(error);
      ReplicateErrorHandler.logError(error, {
        operation,
        cursor,
        duration,
      });

      throw replicateError;
    }
  }

  /**
   * Get a specific model with retry logic and performance monitoring
   */
  async getModel(owner: string, name: string): Promise<Model> {
    const operation = 'get_model';
    const modelId = `${owner}/${name}`;
    const startTime = Date.now();

    try {
      const result = await this.retryManager.execute(async () => {
        return await this.client.models.get(owner, name);
      }, this.getRetryOptionsForOperation(operation));

      // Record success metrics
      const duration = Date.now() - startTime;
      if (this.ctx) {
        await defaultPerformanceMonitor.recordSuccess(
          this.ctx,
          modelId,
          operation,
          duration,
          {
            owner,
            name,
            visibility: result.visibility,
          }
        );
      }

      return result as Model;
    } catch (error) {
      // Record failure metrics
      const duration = Date.now() - startTime;
      if (this.ctx) {
        await defaultPerformanceMonitor.recordFailure(
          this.ctx,
          modelId,
          operation,
          error,
          duration,
          {
            owner,
            name,
          }
        );
      }

      const replicateError = ReplicateError.from(error);
      ReplicateErrorHandler.logError(error, {
        operation,
        modelId,
        duration,
      });

      throw replicateError;
    }
  }

  /**
   * List model versions with retry logic
   */
  async listModelVersions(owner: string, name: string, cursor?: string): Promise<any> {
    const operation = 'list_model_versions';
    const modelId = `${owner}/${name}`;
    const startTime = Date.now();

    try {
      const result = await this.retryManager.execute(async () => {
        return await this.client.models.versions.list(owner, name, { cursor });
      }, this.getRetryOptionsForOperation(operation));

      // Record success metrics
      const duration = Date.now() - startTime;
      if (this.ctx) {
        await defaultPerformanceMonitor.recordSuccess(
          this.ctx,
          modelId,
          operation,
          duration,
          {
            owner,
            name,
            cursor,
            resultCount: result.results?.length || 0,
          }
        );
      }

      return result;
    } catch (error) {
      // Record failure metrics
      const duration = Date.now() - startTime;
      if (this.ctx) {
        await defaultPerformanceMonitor.recordFailure(
          this.ctx,
          modelId,
          operation,
          error,
          duration,
          {
            owner,
            name,
            cursor,
          }
        );
      }

      const replicateError = ReplicateError.from(error);
      ReplicateErrorHandler.logError(error, {
        operation,
        modelId,
        duration,
      });

      throw replicateError;
    }
  }

  /**
   * Get retry options based on operation type
   */
  private getRetryOptionsForOperation(operation: string): RetryOptions {
    switch (operation) {
      case 'create_prediction':
        // Prediction creation is critical, use more aggressive retries
        return {
          maxRetries: 5,
          baseDelay: 2000,
          maxDelay: 30000,
          backoffMultiplier: 2,
          jitterFactor: 0.2,
        };

      case 'get_prediction':
        // Getting predictions should be fast and reliable
        return {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          jitterFactor: 0.1,
        };

      case 'list_models':
      case 'get_model':
      case 'list_model_versions':
        // Model operations are less time-sensitive
        return {
          maxRetries: 3,
          baseDelay: 1500,
          maxDelay: 15000,
          backoffMultiplier: 2,
          jitterFactor: 0.15,
        };

      case 'cancel_prediction':
        // Cancellation should be quick
        return {
          maxRetries: 2,
          baseDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
          jitterFactor: 0.1,
        };

      default:
        // Default retry options
        return {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          jitterFactor: 0.1,
        };
    }
  }

  /**
   * Get the underlying Replicate client (for advanced use cases)
   */
  getClient(): Replicate {
    return this.client;
  }

  /**
   * Update the Convex context for performance monitoring
   */
  setContext(ctx: any): void {
    this.ctx = ctx;
  }

  /**
   * Check if the client has a context for monitoring
   */
  hasContext(): boolean {
    return !!this.ctx;
  }

  /**
   * Create a new client instance with the same configuration but different context
   */
  withContext(ctx: any): EnhancedReplicateClient {
    const newClient = new EnhancedReplicateClient(
      this.client.auth || process.env.REPLICATE_API_TOKEN || '',
      ctx
    );
    return newClient;
  }
}

/**
 * Factory function to create an enhanced Replicate client
 */
export function createEnhancedReplicateClient(
  apiToken?: string,
  ctx?: any
): EnhancedReplicateClient {
  const token = apiToken || process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error('Replicate API token is required');
  }
  
  return new EnhancedReplicateClient(token, ctx);
}

/**
 * Default enhanced client instance (without context) - created lazily
 */
let _defaultEnhancedReplicateClient: EnhancedReplicateClient | null = null;

export function getDefaultEnhancedReplicateClient(): EnhancedReplicateClient {
  if (!_defaultEnhancedReplicateClient) {
    _defaultEnhancedReplicateClient = createEnhancedReplicateClient();
  }
  return _defaultEnhancedReplicateClient;
}

// For backward compatibility
export const defaultEnhancedReplicateClient = {
  get client() {
    return getDefaultEnhancedReplicateClient();
  }
};