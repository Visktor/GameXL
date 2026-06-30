import db from "@GameXL/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../index";
import { queryIGDB } from "../lib/igdb";

const spanSchema = z.enum(["today", "week", "month", "year"]);

function getTimeRange(span: z.infer<typeof spanSchema>): {
	start: number;
	end: number;
} {
	const now = new Date();
	const y = now.getFullYear();
	const m = now.getMonth();
	const d = now.getDate();

	if (span === "today") {
		const start = new Date(y, m, d);
		const end = new Date(y, m, d + 1);
		return {
			start: Math.floor(start.getTime() / 1000),
			end: Math.floor(end.getTime() / 1000) - 1,
		};
	}

	if (span === "week") {
		const day = now.getDay(); // 0 = Sunday
		const monday = new Date(y, m, d - (day === 0 ? 6 : day - 1));
		const sunday = new Date(monday);
		sunday.setDate(sunday.getDate() + 7);
		return {
			start: Math.floor(monday.getTime() / 1000),
			end: Math.floor(sunday.getTime() / 1000) - 1,
		};
	}

	if (span === "month") {
		const start = new Date(y, m, 1);
		const end = new Date(y, m + 1, 1);
		return {
			start: Math.floor(start.getTime() / 1000),
			end: Math.floor(end.getTime() / 1000) - 1,
		};
	}

	// year
	const start = new Date(y, 0, 1);
	const end = new Date(y + 1, 0, 1);
	return {
		start: Math.floor(start.getTime() / 1000),
		end: Math.floor(end.getTime() / 1000) - 1,
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
				span: spanSchema,
				offset: z.number().int().min(0).default(0),
			})
		)
		.query(async ({ input, ctx }) => {
			const { start, end } = getTimeRange(input.span);

			let igdbGames: IGDBGame[];
			try {
				igdbGames = await queryIGDB<IGDBGame[]>(
					"games",
					`fields id, name, cover.url, first_release_date, rating, videos.video_id;
					 where first_release_date >= ${start} & first_release_date <= ${end};
					 sort first_release_date desc;
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

			// Fetch GameXL avg scores for games we have in our DB
			const dbGames = await db.game.findMany({
				where: { externalApiKey: { in: igdbIds } },
				select: {
					externalApiKey: true,
					userGames: {
						where: { score: { not: null } },
						select: { score: true },
					},
				},
			});

			const avgScoreMap = new Map<string, number | null>();
			for (const g of dbGames) {
				const scores = g.userGames.map((ug) => Number(ug.score));
				avgScoreMap.set(
					g.externalApiKey,
					scores.length
						? scores.reduce((a, b) => a + b, 0) / scores.length
						: null
				);
			}

			// Fetch tracked status for current user or guest
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
					gamexlAvgScore: avgScoreMap.get(igdbId) ?? null,
					trackedStatus: trackedMap.get(igdbId) ?? null,
				};
			});

			return {
				games,
				nextOffset:
					igdbGames.length === PAGE_SIZE ? input.offset + PAGE_SIZE : null,
			};
		}),
});
