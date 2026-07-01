import db from "@GameXL/db";
import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import { z } from "zod";
import { publicProcedure, router } from "../index";
import { queryIGDB } from "../lib/igdb";
import { buildPage, paginationInput } from "../utils/pagination";

const spanSchema = z.enum(["today", "week", "month", "year"]);
const sortBySchema = z.enum(["date", "rating", "popularity", "score"]);

const IGDB_SORT: Record<z.infer<typeof sortBySchema>, string> = {
	date: "first_release_date desc",
	rating: "rating desc",
	popularity: "rating_count desc",
	score: "total_rating desc",
};

function getTimeRange(span: z.infer<typeof spanSchema>): {
	start: number;
	end: number;
} {
	const now = DateTime.now();

	const ranges: Record<typeof span, { start: DateTime; end: DateTime }> = {
		today: { start: now.startOf("day"), end: now.endOf("day") },
		week: { start: now.startOf("week"), end: now.endOf("week") },
		month: { start: now.startOf("month"), end: now.endOf("month") },
		year: { start: now.startOf("year"), end: now.endOf("year") },
	};

	const { start, end } = ranges[span];

	return {
		start: Math.floor(start.toSeconds()),
		end: Math.floor(end.toSeconds()),
	};
}

interface IGDBGame {
	cover?: { url: string };
	first_release_date?: number;
	id: number;
	name: string;
	rating?: number;
	videos?: { video_id: string }[];
}

const PAGE_SIZE = 20;

export const releasesRouter = router({
	list: publicProcedure
		.input(
			z.object({
				...paginationInput.shape,
				span: spanSchema,
				sortBy: sortBySchema.default("popularity"),
			})
		)
		.query(async ({ input, ctx }) => {
			const { start, end } = getTimeRange(input.span);
			const sort = IGDB_SORT[input.sortBy];
			let igdbGames: IGDBGame[];

			try {
				igdbGames = await queryIGDB<IGDBGame[]>(
					"games",
					`fields id, name, cover.url, first_release_date, rating, rating_count, total_rating, videos.video_id;
					 where first_release_date >= ${start} & first_release_date <= ${end};
					 sort ${sort};
					 limit ${PAGE_SIZE};
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
				const coverUrl = g.cover?.url
					? `https:${g.cover.url.replace("t_thumb", "t_cover_big")}`
					: null;

				return {
					igdbId,
					title: g.name,
					coverUrl,
					trailerVideoId: g.videos?.[0]?.video_id ?? null,
					releaseDate: g.first_release_date ?? null,
					igdbScore: g.rating ?? null,
					trackedStatus: trackedMap.get(igdbId) ?? null,
				};
			});

			const { nextOffset } = buildPage(igdbGames, PAGE_SIZE, input.offset);
			return { games, nextOffset };
		}),
});
