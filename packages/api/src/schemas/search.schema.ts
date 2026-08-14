import { z } from "zod";
import { SEARCH_MODES } from "./search-mode";

export const searchQuerySchema = z.string().trim().default("");
export const searchModeSchema = z.enum(SEARCH_MODES);
export const searchSortBySchema = z.enum([
	"popularity",
	"rating",
	"recent",
	"az",
]);

export type SearchMode = z.infer<typeof searchModeSchema>;
export type SearchSortBy = z.infer<typeof searchSortBySchema>;
