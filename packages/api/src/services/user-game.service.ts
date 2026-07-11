import db from "@GameXL/db";
import { TRPCError } from "@trpc/server";
import type { Context } from "../context";
import type { GameData, GameStatus } from "../schemas/user-game.schema";

interface TrackGameInput {
	gameData: GameData;
	status: GameStatus;
}

export interface TrackedGameEntry {
	coverUrl: string | null;
	igdbId: string;
	igdbScore: number | null;
	releaseDate: number | null;
	status: GameStatus;
	title: string;
	trailerVideoId: string | null;
	updatedAt: number;
}

const YOUTUBE_WATCH_ID_PARAM = "v";

function extractYoutubeVideoId(trailerUrl: string | null): string | null {
	if (!trailerUrl) {
		return null;
	}

	try {
		return new URL(trailerUrl).searchParams.get(YOUTUBE_WATCH_ID_PARAM);
	} catch {
		return null;
	}
}

const trackedGameSelect = {
	status: true,
	updatedAt: true,
	game: {
		select: {
			externalApiKey: true,
			title: true,
			coverUrl: true,
			trailerUrl: true,
			releaseDate: true,
			igdbScore: true,
		},
	},
} as const;

function mapTrackedGame(userGame: {
	status: string;
	updatedAt: Date;
	game: {
		externalApiKey: string;
		title: string;
		coverUrl: string | null;
		trailerUrl: string | null;
		releaseDate: Date | null;
		igdbScore: { toNumber(): number } | null;
	};
}): TrackedGameEntry {
	return {
		igdbId: userGame.game.externalApiKey,
		title: userGame.game.title,
		coverUrl: userGame.game.coverUrl,
		trailerVideoId: extractYoutubeVideoId(userGame.game.trailerUrl),
		releaseDate: userGame.game.releaseDate
			? Math.floor(userGame.game.releaseDate.getTime() / 1000)
			: null,
		igdbScore: userGame.game.igdbScore?.toNumber() ?? null,
		status: userGame.status as GameStatus,
		updatedAt: userGame.updatedAt.getTime(),
	};
}

export async function trackGame({
	input,
	ctx,
}: {
	input: TrackGameInput;
	ctx: Pick<Context, "session" | "guestSession" | "logger">;
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

	ctx.logger.info(
		{ event: "game.tracked", gameId: game.id, status },
		"Game tracked"
	);
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

export async function getMyTrackedGames({
	ctx,
}: {
	ctx: Pick<Context, "session" | "guestSession">;
}): Promise<TrackedGameEntry[]> {
	if (!(ctx.session || ctx.guestSession)) {
		return [];
	}

	const userGames = await db.userGame.findMany({
		where: ctx.session
			? { userId: ctx.session.user.id }
			: { guestSessionId: ctx.guestSession?.id },
		select: trackedGameSelect,
		orderBy: { updatedAt: "desc" },
	});

	return userGames.map(mapTrackedGame);
}

export async function getTrackedGamesByUsername({
	input,
}: {
	input: { username: string };
}): Promise<TrackedGameEntry[]> {
	const user = await db.user.findUnique({
		where: { username: input.username },
		select: { id: true },
	});

	if (!user) {
		throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
	}

	const userGames = await db.userGame.findMany({
		where: { userId: user.id },
		select: trackedGameSelect,
		orderBy: { updatedAt: "desc" },
	});

	return userGames.map(mapTrackedGame);
}
