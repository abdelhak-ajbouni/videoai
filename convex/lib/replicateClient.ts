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
 * Create a Replicate client instance
 */
export function createReplicateClient(apiToken?: string): Replicate {
  const token = apiToken || process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("Replicate API token is required");
  }

  return new Replicate({ auth: token });
}

/**
 * Create an enhanced Replicate client with Convex context
 */
export function createEnhancedReplicateClient(
  apiToken: string,
  ctx: unknown
): Replicate {
  const token = apiToken || process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("Replicate API token is required");
  }

  return new Replicate({ auth: token });
}

/**
 * Create a new prediction
 */
export async function createPrediction(
  client: Replicate,
  params: PredictionParams
): Promise<unknown> {
  return await client.predictions.create({
    model: params.model,
    input: params.input,
    webhook: params.webhook,
    stream: params.stream,
  });
}
