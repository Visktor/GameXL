import { z } from "zod";
import { publicProcedure, router } from "../index";
import {
	searchModeSchema,
	searchQuerySchema,
	searchSortBySchema,
} from "../schemas/search.schema";
import { SearchService } from "../services/search.service";
import { paginationInput } from "../utils/pagination";

export const searchRouter = router({
	list: publicProcedure
		.input(
			z.object({
				...paginationInput.shape,
				q: searchQuerySchema,
				mode: searchModeSchema.default("contains"),
				genres: z.array(z.string()).default([]),
				minRating: z.number().min(0).max(100).optional(),
				sortBy: searchSortBySchema.default("popularity"),
			})
		)
		.query(SearchService.searchGames),
	genres: publicProcedure.query(() => SearchService.listGenres()),
});
