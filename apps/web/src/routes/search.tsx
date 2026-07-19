import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";

import { GameListView } from "@/components/game-list-view";
import { SearchGenreFilter } from "@/components/search-genre-filter";
import { SearchInput } from "@/components/search-input";
import { SearchNoResults } from "@/components/search-no-results";
import { SearchRatingFilter } from "@/components/search-rating-filter";
import type { SearchSortBy } from "@/components/search-sort-select";
import { SearchSortSelect } from "@/components/search-sort-select";
import { SearchTrendingSection } from "@/components/search-trending-section";
import { RATING_SCALE } from "@/constants/rating";
import { trpcClient } from "@/utils/trpc";

const SEARCH_MODES = [
	{ key: "contains", label: "Contains" },
	{ key: "fulltext", label: "Full text" },
] as const;

type SearchMode = (typeof SEARCH_MODES)[number]["key"];

function parseGenres(raw: string | null): string[] {
	return raw ? raw.split(",").filter(Boolean) : [];
}

function parseRatingStars(raw: string | null): number {
	const parsed = Number(raw ?? "0");
	return Number.isNaN(parsed) ? 0 : parsed;
}

function buildParams({
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

export default function SearchPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [clearSignal, setClearSignal] = useState(0);

	const q = searchParams.get("q") ?? "";
	const mode: SearchMode = (searchParams.get("mode") ??
		"contains") as SearchMode;
	const genres = parseGenres(searchParams.get("genres"));
	const ratingStars = parseRatingStars(searchParams.get("rating"));
	const sortBy: SearchSortBy = (searchParams.get("sortBy") ??
		"popularity") as SearchSortBy;

	const isEmptyState =
		q.length === 0 && genres.length === 0 && ratingStars === 0;
	const minRating = ratingStars > 0 ? ratingStars * RATING_SCALE : undefined;

	const updateSearchParams = (
		partial: Partial<{
			genres: string[];
			mode: SearchMode;
			q: string;
			ratingStars: number;
			sortBy: SearchSortBy;
		}>
	) => {
		setSearchParams(
			buildParams({ q, mode, genres, ratingStars, sortBy, ...partial })
		);
	};

	const handleClearFilters = () => {
		setClearSignal((n) => n + 1);
		setSearchParams(
			buildParams({ q: "", mode, genres: [], ratingStars: 0, sortBy })
		);
	};

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
		useInfiniteQuery({
			queryKey: ["search", q, mode, genres, minRating, sortBy],
			queryFn: ({ pageParam }) =>
				trpcClient.search.list.query({
					q,
					mode,
					genres,
					minRating,
					sortBy,
					offset: pageParam,
				}),
			initialPageParam: 0,
			getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
			enabled: !isEmptyState,
		});

	const games = data?.pages.flatMap((p) => p.games) ?? [];

	return (
		<main className="@container flex h-full flex-col overflow-hidden">
			<div className="flex shrink-0 flex-col gap-3 border-b p-4">
				<SearchInput
					initialQuery={q}
					key={clearSignal}
					onQueryChange={(nextQ) => updateSearchParams({ q: nextQ })}
					typeaheadResults={games}
				/>

				<div className="flex flex-wrap items-center justify-between gap-3">
					<SearchGenreFilter
						onToggle={(genre) =>
							updateSearchParams({
								genres: genres.includes(genre)
									? genres.filter((g) => g !== genre)
									: [...genres, genre],
							})
						}
						selectedGenres={genres}
					/>

					<div className="flex items-center gap-3">
						<SearchRatingFilter
							minRating={ratingStars}
							onChange={(value) => updateSearchParams({ ratingStars: value })}
						/>
						<SearchSortSelect
							onChange={(value) => updateSearchParams({ sortBy: value })}
							value={sortBy}
						/>
						{q.length > 0 && (
							<div className="flex overflow-hidden rounded-none border">
								{SEARCH_MODES.map(({ key, label }) => (
									<button
										className={`px-2.5 py-1 text-xs transition-colors ${
											mode === key
												? "bg-accent font-medium"
												: "text-muted-foreground hover:bg-accent/50"
										}`}
										key={key}
										onClick={() => updateSearchParams({ mode: key })}
										type="button"
									>
										{label}
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-hidden p-4">
				{isEmptyState ? (
					<SearchTrendingSection />
				) : (
					<GameListView
						emptyState={
							<SearchNoResults onClearFilters={handleClearFilters} query={q} />
						}
						endMessage="You've seen all results."
						errorMessage="Failed to search games. Please try again."
						fetchNextPage={fetchNextPage}
						games={games}
						hasNextPage={Boolean(hasNextPage)}
						isFetchingNextPage={isFetchingNextPage}
						status={status}
					/>
				)}
			</div>
		</main>
	);
}
