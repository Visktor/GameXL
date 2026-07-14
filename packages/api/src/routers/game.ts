import { z } from "zod";
import { publicProcedure, router } from "../index";
import { igdbIdSchema } from "../schemas/game.schema";
import { getGameById, getGameScreenshots } from "../services/game.service";

export const gameRouter = router({
	getById: publicProcedure
		.input(z.object({ igdbId: igdbIdSchema }))
		.query(getGameById),
	getScreenshots: publicProcedure
		.input(z.object({ igdbId: igdbIdSchema }))
		.query(getGameScreenshots),
});
