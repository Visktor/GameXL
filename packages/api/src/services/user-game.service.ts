import db from "@GameXL/db";
import type { Context } from "../context";
import type { GameData, GameStatus } from "../schemas/user-game.schema";

interface TrackGameInput {
	gameData: GameData;
	status: GameStatus;
}

export async function trackGame({
	input,
	ctx,
}: {
	input: TrackGameInput;
	ctx: Pick<Context, "session" | "guestSession">;
}) {
	const { gameData, status } = input;

	const game = await db.game.upsert({
		where: { externalApiKey: gameData.igdbId },
		create: {
			externalApiKey: gameData.igdbId,
			title: gameData.title,
			coverUrl: gameData.coverUrl,
			trailerUrl: gameData.trailerVideoId
				? `https://www.youtube.com/watch?v=${gameData.trailerVideoId}`
				: null,
			releaseDate: gameData.releaseDate
				? new Date(gameData.releaseDate * 1000)
				: null,
			igdbScore: gameData.igdbScore,
		},
		update: {},
		select: { id: true },
	});

	if (ctx.session) {
		const userId = ctx.session.user.id;
		await db.userGame.upsert({
			where: { userId_gameId: { userId, gameId: game.id } },
			create: { userId, gameId: game.id, status },
			update: { status },
		});
	} else if (ctx.guestSession) {
		const guestSessionId = ctx.guestSession.id;
		await db.userGame.upsert({
			where: { guestSessionId_gameId: { guestSessionId, gameId: game.id } },
			create: { guestSessionId, gameId: game.id, status },
			update: { status },
		});
	}
}

export async function removeGame({
	input,
	ctx,
}: {
	input: { igdbId: string };
	ctx: Pick<Context, "session" | "guestSession">;
}) {
	const game = await db.game.findUnique({
		where: { externalApiKey: input.igdbId },
		select: { id: true },
	});

	if (!game) {
		return;
	}

	if (ctx.session) {
		await db.userGame.deleteMany({
			where: { userId: ctx.session.user.id, gameId: game.id },
		});
	} else if (ctx.guestSession) {
		await db.userGame.deleteMany({
			where: { guestSessionId: ctx.guestSession.id, gameId: game.id },
		});
	}
}
