import { protectedProcedure, publicProcedure, router } from "../index";
import { gameRouter } from "./game";
import { guestSessionRouter } from "./guest-session";
import { releasesRouter } from "./releases";
import { searchRouter } from "./search";
import { userRouter } from "./user";
import { userGameRouter } from "./user-game";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	game: gameRouter,
	guestSession: guestSessionRouter,
	releases: releasesRouter,
	search: searchRouter,
	user: userRouter,
	userGame: userGameRouter,
});
export type AppRouter = typeof appRouter;
