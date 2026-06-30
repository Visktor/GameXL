import { createContext } from "@GameXL/api/context";
import { appRouter } from "@GameXL/api/routers/index";
import { auth } from "@GameXL/auth";
import { env } from "@GameXL/env/server";
import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
	"*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "x-fingerprint"],
		credentials: true,
	})
);

app.on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, c) => createContext(c),
	})
);

app.get("/", (c) => c.text("OK"));

serve({ fetch: app.fetch, port: 3000 }, () => {
	console.log("Server is running on http://localhost:3000");
});
