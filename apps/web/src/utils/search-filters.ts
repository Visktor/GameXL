import { RATING_SCALE } from "@/constants/rating";
import { SEARCH_MODE_OPTIONS, type SearchMode } from "@/constants/search-mode";
import { type SearchSortBy, SORT_OPTIONS } from "@/constants/search-sort";

export interface SearchFilters {
	genres: string[];
	mode: SearchMode;
	q: string;
	ratingStars: number;
	sortBy: SearchSortBy;
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
	q: "",
	mode: "contains",
	genres: [],
	ratingStars: 0,
	sortBy: "popularity",
};

export class SearchFilterUtils {
	static parse(searchParams: URLSearchParams): SearchFilters {
		return {
			q: searchParams.get("q") ?? DEFAULT_SEARCH_FILTERS.q,
			mode: SearchFilterUtils.parseEnum(
				searchParams.get("mode"),
				SEARCH_MODE_OPTIONS,
				DEFAULT_SEARCH_FILTERS.mode
			),
			genres: SearchFilterUtils.parseList(searchParams.get("genres")),
			ratingStars: SearchFilterUtils.parseNumber(
				searchParams.get("rating"),
				DEFAULT_SEARCH_FILTERS.ratingStars
			),
			sortBy: SearchFilterUtils.parseEnum(
				searchParams.get("sortBy"),
				SORT_OPTIONS,
				DEFAULT_SEARCH_FILTERS.sortBy
			),
		};
	}

	static toParams(filters: SearchFilters): Record<string, string> {
		return SearchFilterUtils.serialize({
			q: filters.q,
			mode:
				filters.mode === DEFAULT_SEARCH_FILTERS.mode ? undefined : filters.mode,
			genres: filters.genres.length > 0 ? filters.genres.join(",") : undefined,
			rating: filters.ratingStars > 0 ? String(filters.ratingStars) : undefined,
			sortBy:
				filters.sortBy === DEFAULT_SEARCH_FILTERS.sortBy
					? undefined
					: filters.sortBy,
		});
	}

	static isEmpty(filters: SearchFilters): boolean {
		return (
			filters.q.length === 0 &&
			filters.genres.length === 0 &&
			filters.ratingStars === 0
		);
	}

	static toMinRating(ratingStars: number): number | undefined {
		return ratingStars > 0 ? ratingStars * RATING_SCALE : undefined;
	}

	private static parseEnum<T extends string>(
		raw: string | null,
		options: readonly { value: T }[],
		fallback: T
	): T {
		return options.some((option) => option.value === raw)
			? (raw as T)
			: fallback;
	}

	private static parseList(raw: string | null, separator = ","): string[] {
		return raw ? raw.split(separator).filter(Boolean) : [];
	}

	private static parseNumber(raw: string | null, fallback = 0): number {
		const parsed = Number(raw ?? fallback);
		return Number.isNaN(parsed) ? fallback : parsed;
	}

	private static serialize(
		entries: Record<string, string | undefined>
	): Record<string, string> {
		const params: Record<string, string> = {};
		for (const [key, value] of Object.entries(entries)) {
			if (value) {
				params[key] = value;
			}
		}
		return params;
	}
}
