import { z } from "zod";

export const searchQuerySchema = z.string().trim().min(1);
export const searchModeSchema = z.enum(["contains", "fulltext"]);

export type SearchMode = z.infer<typeof searchModeSchema>;
