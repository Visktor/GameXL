import { z } from "zod";
import { guestProcedure, publicProcedure, router } from "../index";
import { gameDataSchema, gameStatusSchema } from "../schemas/user-game.schema";
import {
	getMyTrackedGames,
	getTrackedGamesByUsername,
	removeGame,
	trackGame,
} from "../services/user-game.service";

export const userGameRouter = router({
	add: guestProcedure
		.input(
			z.object({
				gameData: gameDataSchema,
				status: gameStatusSchema,
			})
		)
		.mutation(trackGame),

	remove: guestProcedure
		.input(z.object({ igdbId: z.string() }))
		.mutation(removeGame),

	myList: publicProcedure.query(getMyTrackedGames),

	listByUsername: publicProcedure
		.input(z.object({ username: z.string() }))
		.query(getTrackedGamesByUsername),
});
