import { z } from "zod";

export const gameDataSchema = z.object({
	igdbId: z.string(),
	title: z.string(),
	coverUrl: z.string().nullable(),
	trailerVideoId: z.string().nullable(),
	releaseDate: z.number().nullable(),
	igdbScore: z.number().nullable(),
});

export const gameStatusSchema = z.enum(["PLAYING", "WANT"]);

export type GameData = z.infer<typeof gameDataSchema>;
export type GameStatus = z.infer<typeof gameStatusSchema>;
