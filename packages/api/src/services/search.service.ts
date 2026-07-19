import { TRPCError } from "@trpc/server";
import type { Context } from "../context";
import { type IGDBGame, queryIGDB } from "../lib/igdb";
import type { SearchMode, SearchSortBy } from "../schemas/search.schema";
import { buildPage, DEFAULT_PAGE_SIZE } from "../utils/pagination";
import { mapIgdbGamesWithTrackedStatus } from "./game-mapper";

const SORT_CLAUSE: Record<SearchSortBy, string> = {
	popularity: "rating_count desc",
	rating: "rating desc",
	recent: "first_release_date desc",
	az: "name asc",
};

function escapeIGDBString(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildWhereFragments({
	genres,
	minRating,
}: {
	genres: string[];
	minRating?: number;
}): string[] {
	const fragments: string[] = [];

	if (genres.length > 0) {
		const genreList = genres
			.map((genre) => `"${escapeIGDBString(genre)}"`)
			.join(",");
		fragments.push(`genres.name = (${genreList})`);
	}

	if (minRating !== undefined) {
		fragments.push(`rating >= ${minRating}`);
	}

	return fragments;
}

function buildQuery(input: SearchGamesInput): string {
	const fields =
		"fields id, name, cover.url, screenshots.url, first_release_date, rating, videos.video_id, videos.name;";
	const limitOffset = `limit ${DEFAULT_PAGE_SIZE}; offset ${input.offset};`;
	const filterFragments = buildWhereFragments(input);

	if (input.q.length > 0 && input.mode === "fulltext") {
		const where = filterFragments.length
			? `where ${filterFragments.join(" & ")};`
			: "";
		return `search "${escapeIGDBString(input.q)}";\n${where}\n${fields}\n${limitOffset}`;
	}

	if (input.q.length > 0) {
		filterFragments.unshift(`name ~ *"${escapeIGDBString(input.q)}"*`);
	}

	const where = filterFragments.length
		? `where ${filterFragments.join(" & ")};`
		: "";
	return `${where}\n${fields}\nsort ${SORT_CLAUSE[input.sortBy]};\n${limitOffset}`;
}

interface SearchGamesInput {
	genres: string[];
	minRating?: number;
	mode: SearchMode;
	offset: number;
	q: string;
	sortBy: SearchSortBy;
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
		igdbGames = await queryIGDB<IGDBGame[]>("games", buildQuery(input));
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

const MAX_GENRES = 50;

export async function listGenres(): Promise<string[]> {
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
