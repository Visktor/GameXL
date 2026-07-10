import { Logger } from "@GameXL/logger";
import { serve } from "@hono/node-server";
import { app } from "./app";

serve({ fetch: app.fetch, port: 3000 }, () => {
	Logger.info("Server is running on http://localhost:3000");
});
