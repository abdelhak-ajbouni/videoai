import { getSecureConfig } from "../lib/env";

const config = getSecureConfig();

export default {
  providers: [
    {
      domain: config.clerk.jwtIssuerDomain,
      applicationID: "convex",
    },
  ],
};
