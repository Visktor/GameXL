import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import type { Context } from "../context";
import { type IGDBGame, queryIGDB } from "../lib/igdb";
import { IGDB_SORT, type SortBy, type Span } from "../schemas/releases.schema";
import { buildPage, DEFAULT_PAGE_SIZE } from "../utils/pagination";
import { mapIgdbGamesWithTrackedStatus } from "./game-mapper";

function getTimeRange(span: Span): { start: number; end: number } {
	const now = DateTime.now();
	const ranges: Record<Span, { start: DateTime; end: DateTime }> = {
		today: { start: now.startOf("day"), end: now.endOf("day") },
		week: { start: now.startOf("week"), end: now.endOf("week") },
		month: { start: now.minus({ days: 30 }), end: now },
		year: { start: now.startOf("year"), end: now.endOf("year") },
	};
	const { start, end } = ranges[span];
	return {
		start: Math.floor(start.toSeconds()),
		end: Math.floor(end.toSeconds()),
	};
}

interface ListReleasesInput {
	offset: number;
	sortBy: SortBy;
	span: Span;
}

export async function listReleases({
	input,
	ctx,
}: {
	input: ListReleasesInput;
	ctx: Pick<Context, "session" | "guestSession" | "logger">;
}) {
	const { start, end } = getTimeRange(input.span);
	const sort = IGDB_SORT[input.sortBy];
	let igdbGames: IGDBGame[];

	try {
		igdbGames = await queryIGDB<IGDBGame[]>(
			"games",
			`fields id, name, cover.url, screenshots.url, first_release_date, rating, rating_count, total_rating, videos.video_id, videos.name;
			 where first_release_date >= ${start} & first_release_date <= ${end};
			 sort ${sort};
			 limit ${DEFAULT_PAGE_SIZE};
			 offset ${input.offset};`
		);
	} catch (err) {
		ctx.logger.error(
			{ err, span: input.span },
			"Failed to fetch releases from IGDB"
		);
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to fetch releases from IGDB",
		});
	}

	if (!igdbGames.length) {
		return { games: [], nextOffset: null };
	}

	const games = await mapIgdbGamesWithTrackedStatus(igdbGames, ctx);
	const { nextOffset } = buildPage(igdbGames, DEFAULT_PAGE_SIZE, input.offset);
	return { games, nextOffset };
}
