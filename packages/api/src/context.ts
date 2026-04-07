import { auth } from "@GameXL/auth";
import type { Context as HonoContext } from "hono";

export async function createContext(c: HonoContext) {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});
	return {
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
