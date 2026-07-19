import { z } from "zod";
import { gameDataSchema } from "./user-game.schema";

export const createGameListSchema = z.object({
	name: z.string().min(1).max(100),
	isPublic: z.boolean().default(false),
});

export const updateGameListSchema = z.object({
	listId: z.string(),
	name: z.string().min(1).max(100).optional(),
	isPublic: z.boolean().optional(),
});

export const addGameToListSchema = z.object({
	listId: z.string(),
	gameData: gameDataSchema,
});

export const removeGameFromListSchema = z.object({
	listId: z.string(),
	igdbId: z.string(),
});

export const reorderGameListSchema = z.object({
	listId: z.string(),
	orderedIgdbIds: z.array(z.string()).min(1),
});

export type CreateGameListInput = z.infer<typeof createGameListSchema>;
export type UpdateGameListInput = z.infer<typeof updateGameListSchema>;
export type AddGameToListInput = z.infer<typeof addGameToListSchema>;
export type RemoveGameFromListInput = z.infer<typeof removeGameFromListSchema>;
export type ReorderGameListInput = z.infer<typeof reorderGameListSchema>;
