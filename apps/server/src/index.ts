import { env } from "@GameXL/env/server";
import { Logger } from "@GameXL/logger";
import { serve } from "@hono/node-server";
import { app } from "./app";

serve({ fetch: app.fetch, port: env.PORT }, () => {
	Logger.info(`Server is running on http://localhost:${env.PORT}`);
});
