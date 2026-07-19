import { TRPCError } from "@trpc/server";
import { MAX_GENRES } from "../constants/search";
import type { Context } from "../context";
import { type IGDBGame, queryIGDB } from "../lib/igdb";
import { buildPage, DEFAULT_PAGE_SIZE } from "../utils/pagination";
import { type SearchGamesInput, SearchQueryUtils } from "../utils/search-query";
import { mapIgdbGamesWithTrackedStatus } from "./game-mapper";

export class SearchService {
	static async searchGames({
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
				SearchQueryUtils.buildQuery(input)
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
		const { nextOffset } = buildPage(
			igdbGames,
			DEFAULT_PAGE_SIZE,
			input.offset
		);
		return { games, nextOffset };
	}

	static async listGenres(): Promise<string[]> {
		let igdbGenres: { name: string }[];

		try {
			igdbGenres = await queryIGDB<{ name: string }[]>(
				"genres",
				`fields name; sort name asc; limit ${MAX_GENRES};`
			);
		} catch {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch genres from IGDB",
			});
		}

		return igdbGenres.map((genre) => genre.name);
	}
}
