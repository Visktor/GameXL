import { useInfiniteQuery } from "@tanstack/react-query";

import { GameListView } from "@/components/game-list-view";
import { trpcClient } from "@/utils/trpc";

export function SearchTrendingSection() {
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
		useInfiniteQuery({
			queryKey: ["search-trending"],
			queryFn: ({ pageParam }) =>
				trpcClient.releases.list.query({
					span: "year",
					sortBy: "popularity",
					offset: pageParam,
				}),
			initialPageParam: 0,
			getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
		});

	const games = data?.pages.flatMap((p) => p.games) ?? [];

	return (
		<div className="flex h-full flex-col gap-3">
			<h2 className="shrink-0 font-medium text-muted-foreground text-xs uppercase tracking-wide">
				Popular this year
			</h2>
			<div className="flex-1 overflow-hidden">
				<GameListView
					emptyState={
						<div className="flex h-full items-center justify-center">
							<p className="text-muted-foreground">
								Nothing popular to show yet.
							</p>
						</div>
					}
					endMessage="You've seen all of this year's popular games."
					errorMessage="Failed to load trending games. Please try again."
					fetchNextPage={fetchNextPage}
					games={games}
					hasNextPage={Boolean(hasNextPage)}
					isFetchingNextPage={isFetchingNextPage}
					status={status}
				/>
			</div>
		</div>
	);
}
