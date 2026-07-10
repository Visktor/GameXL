import { auth } from "@GameXL/auth";
import db from "@GameXL/db";
import type { RequestVariables } from "@GameXL/logger";
import type { Context as HonoContext } from "hono";
import { getCookie } from "hono/cookie";

export const GUEST_SESSION_COOKIE = "gxl_guest";

export async function createContext(
	c: HonoContext<{ Variables: RequestVariables }>
) {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	let guestSession: { id: string; token: string; fingerprint: string } | null =
		null;

	if (!session) {
		const token = getCookie(c, GUEST_SESSION_COOKIE);

		if (token) {
			guestSession = await db.guestSession.findFirst({
				where: { token, deletedAt: null },
				select: { id: true, token: true, fingerprint: true },
			});
		}
	}

	const logger = c.get("logger").child({
		...(session ? { userId: session.user.id } : {}),
		...(guestSession ? { guestSessionId: guestSession.id } : {}),
	});

	return {
		session,
		guestSession,
		honoContext: c,
		logger,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
