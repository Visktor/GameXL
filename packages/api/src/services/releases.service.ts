import db from "@GameXL/db";
import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import type { Context } from "../context";
import {
	type IGDBGame,
	queryIGDB,
	resolveCoverUrl,
	resolveTrailerVideoId,
} from "../lib/igdb";
import { IGDB_SORT, type SortBy, type Span } from "../schemas/releases.schema";
import { buildPage, DEFAULT_PAGE_SIZE } from "../utils/pagination";

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
	ctx: Pick<Context, "session" | "guestSession">;
}) {
	const { start, end } = getTimeRange(input.span);
	const sort = IGDB_SORT[input.sortBy];
	let igdbGames: IGDBGame[];

	try {
		igdbGames = await queryIGDB<IGDBGame[]>(
			"games",
			`fields id, name, cover.url, first_release_date, rating, rating_count, total_rating, videos.video_id, videos.name;
			 where first_release_date >= ${start} & first_release_date <= ${end};
			 sort ${sort};
			 limit ${DEFAULT_PAGE_SIZE};
			 offset ${input.offset};`
		);
	} catch {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to fetch releases from IGDB",
		});
	}

	if (!igdbGames.length) {
		return { games: [], nextOffset: null };
	}

	const igdbIds = igdbGames.map((g) => String(g.id));
	const trackedMap = new Map<string, string>();

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

	const games = igdbGames.map((g) => {
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

	const { nextOffset } = buildPage(igdbGames, DEFAULT_PAGE_SIZE, input.offset);
	return { games, nextOffset };
}
