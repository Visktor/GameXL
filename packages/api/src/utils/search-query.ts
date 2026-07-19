import { SORT_CLAUSE } from "../constants/search";
import type { SearchMode, SearchSortBy } from "../schemas/search.schema";
import { DEFAULT_PAGE_SIZE } from "./pagination";

export interface SearchGamesInput {
	genres: string[];
	minRating?: number;
	mode: SearchMode;
	offset: number;
	q: string;
	sortBy: SearchSortBy;
}

export class SearchQueryUtils {
	private static escapeIGDBString(value: string): string {
		return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
	}

	private static buildWhereFragments({
		genres,
		minRating,
	}: {
		genres: string[];
		minRating?: number;
	}): string[] {
		const fragments: string[] = [];

		if (genres.length > 0) {
			const genreList = genres
				.map((genre) => `"${SearchQueryUtils.escapeIGDBString(genre)}"`)
				.join(",");
			fragments.push(`genres.name = (${genreList})`);
		}

		if (minRating !== undefined) {
			fragments.push(`rating >= ${minRating}`);
		}

		return fragments;
	}

	static buildQuery(input: SearchGamesInput): string {
		const fields =
			"fields id, name, cover.url, screenshots.url, first_release_date, rating, videos.video_id, videos.name;";
		const limitOffset = `limit ${DEFAULT_PAGE_SIZE}; offset ${input.offset};`;
		const filterFragments = SearchQueryUtils.buildWhereFragments(input);

		if (input.q.length > 0 && input.mode === "fulltext") {
			const where = filterFragments.length
				? `where ${filterFragments.join(" & ")};`
				: "";
			return `search "${SearchQueryUtils.escapeIGDBString(input.q)}";\n${where}\n${fields}\n${limitOffset}`;
		}

		if (input.q.length > 0) {
			filterFragments.unshift(
				`name ~ *"${SearchQueryUtils.escapeIGDBString(input.q)}"*`
			);
		}

		const where = filterFragments.length
			? `where ${filterFragments.join(" & ")};`
			: "";
		return `${where}\n${fields}\nsort ${SORT_CLAUSE[input.sortBy]};\n${limitOffset}`;
	}
}
