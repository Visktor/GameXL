import { TRPCError } from "@trpc/server";
import type { Context } from "../context";
import { type IGDBGame, queryIGDB } from "../lib/igdb";
import type { SearchMode } from "../schemas/search.schema";
import { buildPage, DEFAULT_PAGE_SIZE } from "../utils/pagination";
import { mapIgdbGamesWithTrackedStatus } from "./game-mapper";

function escapeIGDBString(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildFilterClause(mode: SearchMode, q: string): string {
	const escaped = escapeIGDBString(q);
	return mode === "fulltext"
		? `search "${escaped}";`
		: `where name ~ *"${escaped}"*; sort rating_count desc;`;
}

interface SearchGamesInput {
	mode: SearchMode;
	offset: number;
	q: string;
}

export async function searchGames({
	input,
	ctx,
}: {
	input: SearchGamesInput;
	ctx: Pick<Context, "session" | "guestSession">;
}) {
	let igdbGames: IGDBGame[];

	try {
		igdbGames = await queryIGDB<IGDBGame[]>(
			"games",
			`${buildFilterClause(input.mode, input.q)}
			 fields id, name, cover.url, screenshots.url, first_release_date, rating, videos.video_id, videos.name;
			 limit ${DEFAULT_PAGE_SIZE};
			 offset ${input.offset};`
		);
	} catch {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to search games on IGDB",
		});
	}

	if (!igdbGames.length) {
		return { games: [], nextOffset: null };
	}

	const games = await mapIgdbGamesWithTrackedStatus(igdbGames, ctx);
	const { nextOffset } = buildPage(igdbGames, DEFAULT_PAGE_SIZE, input.offset);
	return { games, nextOffset };
}
