import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();

// Install the rate-limiter component
app.use(rateLimiter);

export default app;