import Replicate from "replicate";
import { getSecureConfig } from "./convexEnv";

/**
 * Create a Replicate client instance
 */
export function createReplicateClient(): Replicate {
  const config = getSecureConfig();
  return new Replicate({ auth: config.replicate.apiToken });
}
