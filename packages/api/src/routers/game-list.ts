import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../index";
import {
	addGameToListSchema,
	createGameListSchema,
	removeGameFromListSchema,
	reorderGameListSchema,
	updateGameListSchema,
} from "../schemas/game-list.schema";
import {
	addGameToList,
	createGameList,
	deleteGameList,
	getGameList,
	getGameListsByUsername,
	getMyGameLists,
	removeGameFromList,
	reorderGameList,
	updateGameList,
} from "../services/game-list.service";

export const gameListRouter = router({
	myLists: protectedProcedure.query(getMyGameLists),

	listByUsername: publicProcedure
		.input(z.object({ username: z.string() }))
		.query(getGameListsByUsername),

	get: publicProcedure
		.input(z.object({ listId: z.string() }))
		.query(getGameList),

	create: protectedProcedure
		.input(createGameListSchema)
		.mutation(createGameList),

	update: protectedProcedure
		.input(updateGameListSchema)
		.mutation(updateGameList),

	remove: protectedProcedure
		.input(z.object({ listId: z.string() }))
		.mutation(deleteGameList),

	addGame: protectedProcedure
		.input(addGameToListSchema)
		.mutation(addGameToList),

	removeGame: protectedProcedure
		.input(removeGameFromListSchema)
		.mutation(removeGameFromList),

	reorder: protectedProcedure
		.input(reorderGameListSchema)
		.mutation(reorderGameList),
});
