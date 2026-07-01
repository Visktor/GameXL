import { protectedProcedure, router } from "../index";
import {
	invalidateGuestSession,
	migrateGuestGames,
} from "../services/guest-session.service";

export const guestSessionRouter = router({
	migrateToAccount: protectedProcedure.mutation(migrateGuestGames),
	invalidate: protectedProcedure.mutation(invalidateGuestSession),
});
