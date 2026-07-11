import { TRPCError } from "@trpc/server";
import type { Context } from "../context";
import {
	type IGDBGame,
	queryIGDB,
	resolveDeveloper,
	resolveScreenshotUrls,
} from "../lib/igdb";
import { mapIgdbGamesWithTrackedStatus } from "./game-mapper";

interface GetGameByIdInput {
	igdbId: string;
}

export async function getGameById({
	input,
	ctx,
}: {
	input: GetGameByIdInput;
	ctx: Pick<Context, "session" | "guestSession" | "logger">;
}) {
	let igdbGames: IGDBGame[];

	try {
		igdbGames = await queryIGDB<IGDBGame[]>(
			"games",
			`fields id, name, cover.url, first_release_date, rating, videos.video_id, videos.name,
			 summary, genres.name, platforms.name, screenshots.url, involved_companies.company.name, involved_companies.developer;
			 where id = ${Number(input.igdbId)};`
		);
	} catch (err) {
		ctx.logger.error(
			{ err, igdbId: input.igdbId },
			"Failed to fetch game from IGDB"
		);
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to fetch game from IGDB",
		});
	}

	const igdbGame = igdbGames[0];

	if (!igdbGame) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Game not found" });
	}

	const [game] = await mapIgdbGamesWithTrackedStatus([igdbGame], ctx);

	if (!game) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to map game data",
		});
	}

	return {
		...game,
		summary: igdbGame.summary ?? null,
		developer: resolveDeveloper(igdbGame),
		genres: igdbGame.genres?.map((g) => g.name) ?? [],
		platforms: igdbGame.platforms?.map((p) => p.name) ?? [],
		screenshots: resolveScreenshotUrls(igdbGame),
	};
}
