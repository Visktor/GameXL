import type { SearchSortBy } from "@/constants/search-sort";

type SearchMode = "contains" | "fulltext";

export class SearchParamsUtils {
	static parseGenres(raw: string | null): string[] {
		return raw ? raw.split(",").filter(Boolean) : [];
	}

	static parseRatingStars(raw: string | null): number {
		const parsed = Number(raw ?? "0");
		return Number.isNaN(parsed) ? 0 : parsed;
	}

	static buildSearchParams({
		genres,
		mode,
		q,
		ratingStars,
		sortBy,
	}: {
		genres: string[];
		mode: SearchMode;
		q: string;
		ratingStars: number;
		sortBy: SearchSortBy;
	}): Record<string, string> {
		const params: Record<string, string> = {};
		if (q) {
			params.q = q;
		}
		if (mode !== "contains") {
			params.mode = mode;
		}
		if (genres.length > 0) {
			params.genres = genres.join(",");
		}
		if (ratingStars > 0) {
			params.rating = String(ratingStars);
		}
		if (sortBy !== "popularity") {
			params.sortBy = sortBy;
		}
		return params;
	}
}
