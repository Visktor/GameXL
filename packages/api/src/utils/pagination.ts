import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 20;

export const paginationInput = z.object({
	offset: z.number().int().min(0).default(0),
});

export type PaginationInput = z.infer<typeof paginationInput>;

export interface PaginatedPage<T> {
	items: T[];
	nextOffset: number | null;
}

export function buildPage<T>(
	items: T[],
	pageSize: number,
	currentOffset: number
): PaginatedPage<T> {
	return {
		items,
		nextOffset: items.length === pageSize ? currentOffset + pageSize : null,
	};
}
