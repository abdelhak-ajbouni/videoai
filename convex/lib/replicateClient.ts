import Replicate from "replicate";

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
