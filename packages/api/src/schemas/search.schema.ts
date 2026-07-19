import { z } from "zod";

export const searchQuerySchema = z.string().trim().default("");
export const searchModeSchema = z.enum(["contains", "fulltext"]);
export const searchSortBySchema = z.enum([
	"popularity",
	"rating",
	"recent",
	"az",
]);

export type SearchMode = z.infer<typeof searchModeSchema>;
export type SearchSortBy = z.infer<typeof searchSortBySchema>;
