import Replicate from "replicate";

/**
 * Interface for Replicate prediction parameters
 */
export interface PredictionParams {
  model: string;
  input: Record<string, any>;
  webhook?: string;
  stream?: boolean;
}

/**
 * Simple Replicate client with basic retry logic
 */
export class SimpleReplicateClient {
  private client: Replicate;

  constructor(apiToken: string) {
    this.client = new Replicate({ auth: apiToken });
  }

  /**
   * Create a new prediction with basic retry logic
   */
  async createPrediction(
    params: PredictionParams
  ): Promise<Replicate.Prediction> {
    return await this.withRetry(async () => {
      return await this.client.predictions.create({
        model: params.model,
        input: params.input,
        webhook: params.webhook,
        stream: params.stream,
      });
    });
  }

  /**
   * Get a prediction by ID with basic retry logic
   */
  async getPrediction(id: string): Promise<Replicate.Prediction> {
    return await this.withRetry(async () => {
      return await this.client.predictions.get(id);
    });
  }

  /**
   * Cancel a prediction
   */
  async cancelPrediction(id: string): Promise<Replicate.Prediction> {
    return await this.withRetry(async () => {
      return await this.client.predictions.cancel(id);
    });
  }

  /**
   * List models
   */
  async listModels(cursor?: string): Promise<{ results: Replicate.Model[] }> {
    return await this.withRetry(async () => {
      return await this.client.models.list();
    });
  }

  /**
   * Get a specific model
   */
  async getModel(owner: string, name: string): Promise<Replicate.Model> {
    return await this.withRetry(async () => {
      return await this.client.models.get(owner, name);
    });
  }

  /**
   * List model versions
   */
  async listModelVersions(
    owner: string,
    name: string
  ): Promise<Replicate.ModelVersion[]> {
    return await this.withRetry(async () => {
      return await this.client.models.versions.list(owner, name);
    });
  }

  /**
   * Basic retry logic with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Don't retry on client errors (4xx)
        if (this.isClientError(error)) {
          throw lastError;
        }

        // Wait before retrying with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Check if error is a client error (4xx status codes)
   */
  private isClientError(error: any): boolean {
    const statusCode = error.status || error.statusCode;
    return statusCode >= 400 && statusCode < 500;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get the underlying Replicate client
   */
  getClient(): Replicate {
    return this.client;
  }
}

/**
 * Factory function to create a simple Replicate client
 */
export function createReplicateClient(
  apiToken?: string
): SimpleReplicateClient {
  const token = apiToken || process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("Replicate API token is required");
  }

  return new SimpleReplicateClient(token);
}

/**
 * Default client instance
 */
let _defaultReplicateClient: SimpleReplicateClient | null = null;

export function getDefaultReplicateClient(): SimpleReplicateClient {
  if (!_defaultReplicateClient) {
    _defaultReplicateClient = createReplicateClient();
  }
  return _defaultReplicateClient;
}

// For backward compatibility
export const defaultReplicateClient = {
  get client() {
    return getDefaultReplicateClient();
  },
};
