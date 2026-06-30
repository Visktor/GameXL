import db from "@GameXL/db";
import { z } from "zod";
import { guestProcedure, router } from "../index";

const gameDataSchema = z.object({
	igdbId: z.string(),
	title: z.string(),
	coverUrl: z.string().nullable(),
	trailerVideoId: z.string().nullable(),
	releaseDate: z.number().nullable(),
	igdbScore: z.number().nullable(),
});

export const userGameRouter = router({
	add: guestProcedure
		.input(
			z.object({
				gameData: gameDataSchema,
				status: z.enum(["PLAYING", "WANT"]),
			})
		)
		.mutation(async ({ input, ctx }) => {
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
		}),

	remove: guestProcedure
		.input(z.object({ igdbId: z.string() }))
		.mutation(async ({ input, ctx }) => {
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
		}),
});
