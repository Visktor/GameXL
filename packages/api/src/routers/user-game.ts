import { z } from "zod";
import { guestProcedure, router } from "../index";
import { gameDataSchema, gameStatusSchema } from "../schemas/user-game.schema";
import { removeGame, trackGame } from "../services/user-game.service";

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
});
