import { z } from "zod";

export const spanSchema = z.enum(["today", "week", "month", "year"]);
export const sortBySchema = z.enum(["date", "rating", "popularity", "score"]);

export type Span = z.infer<typeof spanSchema>;
export type SortBy = z.infer<typeof sortBySchema>;

export const IGDB_SORT: Record<SortBy, string> = {
	date: "first_release_date desc",
	rating: "rating desc",
	popularity: "rating_count desc",
	score: "total_rating desc",
};
