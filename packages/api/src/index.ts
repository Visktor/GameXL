import db from "@GameXL/db";
import { initTRPC, TRPCError } from "@trpc/server";
import { setCookie } from "hono/cookie";
import type { Context } from "./context";
import { GUEST_SESSION_COOKIE } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

// Used by mutations available to both guests and authenticated users.
// Creates a guest session on first write if none exists yet.
export const guestProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (ctx.session) {
		return next({ ctx });
	}

	let { guestSession } = ctx;

	if (!guestSession) {
		const fingerprint = ctx.honoContext.req.header("x-fingerprint");
		if (!fingerprint) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Guest session required",
				cause: "No fingerprint",
			});
		}

		const token = crypto.randomUUID();

		const existing = await db.guestSession.findFirst({
			where: { fingerprint, deletedAt: null },
			select: { id: true, token: true, fingerprint: true },
		});

		if (existing) {
			guestSession = await db.guestSession.update({
				where: { id: existing.id },
				data: { token },
				select: { id: true, token: true, fingerprint: true },
			});
		} else {
			guestSession = await db.guestSession.create({
				data: { fingerprint, token },
				select: { id: true, token: true, fingerprint: true },
			});
		}

		setCookie(ctx.honoContext, GUEST_SESSION_COOKIE, token, {
			httpOnly: true,
			sameSite: "Lax",
			path: "/",
		});
	}

	return next({ ctx: { ...ctx, guestSession } });
});
