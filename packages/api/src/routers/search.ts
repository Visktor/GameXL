import { z } from "zod";
import { publicProcedure, router } from "../index";
import { searchModeSchema, searchQuerySchema } from "../schemas/search.schema";
import { searchGames } from "../services/search.service";
import { paginationInput } from "../utils/pagination";

export const searchRouter = router({
	list: publicProcedure
		.input(
			z.object({
				...paginationInput.shape,
				q: searchQuerySchema,
				mode: searchModeSchema.default("contains"),
			})
		)
		.query(searchGames),
});
