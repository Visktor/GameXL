import { createContext } from "@GameXL/api/context";
import { appRouter } from "@GameXL/api/routers/index";
import { auth } from "@GameXL/auth";
import { env } from "@GameXL/env/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";

const app = express();

app.use(
	cors({
		origin: env.CORS_ORIGIN,
		methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
		allowedHeaders: ["*"],
		credentials: true,
	})
);

app.all("/api/auth{/*path}", toNodeHandler(auth));

app.use(
	"/trpc",
	createExpressMiddleware({
		router: appRouter,
		createContext,
	})
);

app.use(express.json());

app.get("/", (_req, res) => {
	res.status(200).send("OK");
});

app.listen(3000, () => {
	console.log("Server is running on http://localhost:3000");
});
