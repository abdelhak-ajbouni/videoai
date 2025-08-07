import { defineApp } from "convex/server";
import r2 from "@convex-dev/r2/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();
app.use(r2);
app.use(rateLimiter);

export default app;