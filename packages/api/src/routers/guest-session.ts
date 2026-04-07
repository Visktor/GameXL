import db from "@GameXL/db";
import { deleteCookie } from "hono/cookie";
import { GUEST_SESSION_COOKIE } from "../context";
import { protectedProcedure, router } from "../index";

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

export const guestSessionRouter = router({
	// Called after signup: migrate guest games to new account, then soft-delete session
	migrateToAccount: protectedProcedure.mutation(async ({ ctx }) => {
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
	}),

	// Called after login: soft-delete guest session, no migration
	invalidate: protectedProcedure.mutation(async ({ ctx }) => {
		const { guestSession, honoContext } = ctx;
		if (!guestSession) {
			return;
		}
		await softDeleteGuestSession(guestSession.id, honoContext);
	}),
});
