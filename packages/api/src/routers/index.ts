import { protectedProcedure, publicProcedure, router } from "../index";
import { guestSessionRouter } from "./guest-session";
import { releasesRouter } from "./releases";
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
	guestSession: guestSessionRouter,
	releases: releasesRouter,
	userGame: userGameRouter,
});
export type AppRouter = typeof appRouter;
