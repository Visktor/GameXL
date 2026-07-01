import db from "@GameXL/db";
import { deleteCookie } from "hono/cookie";
import type { Context } from "../context";
import { GUEST_SESSION_COOKIE } from "../context";

async function softDeleteGuestSession(
	guestSessionId: string,
	honoContext: Parameters<typeof deleteCookie>[0]
) {
	await db.guestSession.update({
		where: { id: guestSessionId },
		data: { deletedAt: new Date() },
	});
	deleteCookie(honoContext, GUEST_SESSION_COOKIE, { path: "/" });
}

export async function migrateGuestGames({
	ctx,
}: {
	ctx: Pick<Context, "guestSession" | "honoContext"> & {
		session: NonNullable<Context["session"]>;
	};
}) {
	const { guestSession, session, honoContext } = ctx;
	if (!guestSession) {
		return;
	}

	const userId = session.user.id;

	const existingUserGameIds = await db.userGame
		.findMany({ where: { userId }, select: { gameId: true } })
		.then((rows) => new Set(rows.map((r) => r.gameId)));

	const guestGames = await db.userGame.findMany({
		where: { guestSessionId: guestSession.id },
	});

	const gamesToMigrate = guestGames.filter(
		(g) => !existingUserGameIds.has(g.gameId)
	);

	if (gamesToMigrate.length > 0) {
		await db.userGame.updateMany({
			where: { id: { in: gamesToMigrate.map((g) => g.id) } },
			data: { guestSessionId: null, userId },
		});
	}

	await softDeleteGuestSession(guestSession.id, honoContext);
}

export async function invalidateGuestSession({
	ctx,
}: {
	ctx: Pick<Context, "guestSession" | "honoContext">;
}) {
	const { guestSession, honoContext } = ctx;
	if (!guestSession) {
		return;
	}
	await softDeleteGuestSession(guestSession.id, honoContext);
}
