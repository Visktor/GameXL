import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";

import { GameListView } from "@/components/game-list-view";
import { SearchGenreFilter } from "@/components/search-genre-filter";
import { SearchInput } from "@/components/search-input";
import { SearchNoResults } from "@/components/search-no-results";
import { SearchRatingFilter } from "@/components/search-rating-filter";
import { SearchSortSelect } from "@/components/search-sort-select";
import { SearchTrendingSection } from "@/components/search-trending-section";
import { SEARCH_MODE_OPTIONS } from "@/constants/search-mode";
import {
	DEFAULT_SEARCH_FILTERS,
	type SearchFilters,
	SearchFilterUtils,
} from "@/utils/search-filters";
import { trpcClient } from "@/utils/trpc";

export default function SearchPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [clearSignal, setClearSignal] = useState(0);

	const { genres, mode, q, ratingStars, sortBy } =
		SearchFilterUtils.parse(searchParams);

	const isEmptyState = SearchFilterUtils.isEmpty({
		genres,
		mode,
		q,
		ratingStars,
		sortBy,
	});
	const minRating = SearchFilterUtils.toMinRating(ratingStars);

	const updateFilters = (partial: Partial<SearchFilters>) => {
		setSearchParams(
			SearchFilterUtils.toParams({
				q,
				mode,
				genres,
				ratingStars,
				sortBy,
				...partial,
			})
		);
	};

	const handleClearFilters = () => {
		setClearSignal((n) => n + 1);
		setSearchParams(SearchFilterUtils.toParams(DEFAULT_SEARCH_FILTERS));
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
					onQueryChange={(nextQ) => updateFilters({ q: nextQ })}
				/>

				<div className="flex flex-wrap items-center justify-between gap-3">
					<SearchGenreFilter
						onToggle={(genre) =>
							updateFilters({
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
							onChange={(value) => updateFilters({ ratingStars: value })}
						/>
						<SearchSortSelect
							onChange={(value) => updateFilters({ sortBy: value })}
							value={sortBy}
						/>
						{q.length > 0 && (
							<div className="flex overflow-hidden rounded-none border">
								{SEARCH_MODE_OPTIONS.map(({ value, label }) => (
									<button
										className={`px-2.5 py-1 text-xs transition-colors ${
											mode === value
												? "bg-accent font-medium"
												: "text-muted-foreground hover:bg-accent/50"
										}`}
										key={value}
										onClick={() => updateFilters({ mode: value })}
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
