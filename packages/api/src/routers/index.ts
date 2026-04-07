import { protectedProcedure, publicProcedure, router } from "../index";
import { guestSessionRouter } from "./guest-session";

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
});
export type AppRouter = typeof appRouter;
