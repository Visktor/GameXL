import { z } from "zod";

export const igdbIdSchema = z.string().trim().min(1);
