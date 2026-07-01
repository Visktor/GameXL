import { z } from "zod";
import { publicProcedure, router } from "../index";
import { sortBySchema, spanSchema } from "../schemas/releases.schema";
import { listReleases } from "../services/releases.service";
import { paginationInput } from "../utils/pagination";

export const releasesRouter = router({
	list: publicProcedure
		.input(
			z.object({
				...paginationInput.shape,
				span: spanSchema,
				sortBy: sortBySchema.default("popularity"),
			})
		)
		.query(listReleases),
});
