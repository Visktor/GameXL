import { z } from "zod";

export const usernameSchema = z.string().trim().min(1);
