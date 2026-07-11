import db from "@GameXL/db";
import type { Context } from "../context";
import {
	type IGDBGame,
	resolveCoverUrl,
	resolveTrailerVideoId,
} from "../lib/igdb";
import type { GameStatus } from "../schemas/user-game.schema";

export interface MappedGame {
	coverUrl: string | null;
	igdbId: string;
	igdbScore: number | null;
	releaseDate: number | null;
	title: string;
	trackedStatus: GameStatus | null;
	trailerVideoId: string | null;
}

export async function mapIgdbGamesWithTrackedStatus(
	igdbGames: IGDBGame[],
	ctx: Pick<Context, "session" | "guestSession">
): Promise<MappedGame[]> {
	if (!igdbGames.length) {
		return [];
	}

	const igdbIds = igdbGames.map((g) => String(g.id));
	const trackedMap = new Map<string, GameStatus>();

	if (ctx.session || ctx.guestSession) {
		const trackedGames = await db.userGame.findMany({
			where: {
				game: { externalApiKey: { in: igdbIds } },
				...(ctx.session
					? { userId: ctx.session.user.id }
					: { guestSessionId: ctx.guestSession?.id }),
			},
			select: {
				status: true,
				game: { select: { externalApiKey: true } },
			},
		});

		for (const ug of trackedGames) {
			trackedMap.set(ug.game.externalApiKey, ug.status);
		}
	}

	return igdbGames.map((g) => {
		const igdbId = String(g.id);
		return {
			igdbId,
			title: g.name,
			coverUrl: resolveCoverUrl(g),
			trailerVideoId: resolveTrailerVideoId(g),
			releaseDate: g.first_release_date ?? null,
			igdbScore: g.rating ?? null,
			trackedStatus: trackedMap.get(igdbId) ?? null,
		};
	});
}
