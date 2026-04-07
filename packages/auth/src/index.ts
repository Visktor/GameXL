import { createPrismaClient } from "@GameXL/db";
import { env } from "@GameXL/env/server";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export function createAuth() {
	const prisma = createPrismaClient();

	return betterAuth({
		database: prismaAdapter(prisma, {
			provider: "postgresql",
		}),

		trustedOrigins: [
			env.CORS_ORIGIN,
			"GameXL://",
			...(env.NODE_ENV === "development"
				? [
						"exp://",
						"exp://**",
						"exp://192.168.*.*:*/**",
						"http://localhost:8081",
					]
				: []),
		],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: env.NODE_ENV === "production" ? "none" : "lax",
				secure: env.NODE_ENV === "production",
				httpOnly: true,
			},
		},
		plugins: [expo()],
	});
}

export const auth = createAuth();
