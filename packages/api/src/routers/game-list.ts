import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../index";
import {
	addGameToListSchema,
	createGameListSchema,
	removeGameFromListSchema,
	reorderGameListSchema,
	updateGameListSchema,
} from "../schemas/game-list.schema";
import { GameListService } from "../services/game-list.service";

export const gameListRouter = router({
	myLists: protectedProcedure.query(GameListService.myLists),

	listByUsername: publicProcedure
		.input(z.object({ username: z.string() }))
		.query(GameListService.listByUsername),

	get: publicProcedure
		.input(z.object({ listId: z.string() }))
		.query(GameListService.get),

	create: protectedProcedure
		.input(createGameListSchema)
		.mutation(GameListService.create),

	update: protectedProcedure
		.input(updateGameListSchema)
		.mutation(GameListService.update),

	remove: protectedProcedure
		.input(z.object({ listId: z.string() }))
		.mutation(GameListService.remove),

	addGame: protectedProcedure
		.input(addGameToListSchema)
		.mutation(GameListService.addGame),

	removeGame: protectedProcedure
		.input(removeGameFromListSchema)
		.mutation(GameListService.removeGame),

	reorder: protectedProcedure
		.input(reorderGameListSchema)
		.mutation(GameListService.reorder),
});
