import type { SearchSortBy } from "../schemas/search.schema";

export const SORT_CLAUSE: Record<SearchSortBy, string> = {
	popularity: "rating_count desc",
	rating: "rating desc",
	recent: "first_release_date desc",
	az: "name asc",
};

export const MAX_GENRES = 50;
