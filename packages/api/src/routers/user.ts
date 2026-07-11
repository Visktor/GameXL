import { z } from "zod";
import { publicProcedure, router } from "../index";
import { usernameSchema } from "../schemas/user.schema";
import { getUserByUsername } from "../services/user.service";

export const userRouter = router({
	getByUsername: publicProcedure
		.input(z.object({ username: usernameSchema }))
		.query(getUserByUsername),
});
