import Replicate from "replicate";

/**
 * Interface for Replicate prediction parameters
 */
export interface PredictionParams {
  model: string;
  input: Record<string, unknown>;
  webhook?: string;
  stream?: boolean;
}

/**
 * Create a Replicate client instance
 */
export function createReplicateClient(): Replicate {
  const token = process.env.REPLICATE_API_TOKEN;

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
