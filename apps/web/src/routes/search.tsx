import { Skeleton } from "@GameXL/ui/components/skeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

import { GameCard } from "@/components/game-card";
import { GAME_GRID_CLASSNAME } from "@/constants/game-grid";
import { trpcClient } from "@/utils/trpc";

const SEARCH_MODES = [
	{ key: "contains", label: "Contains" },
	{ key: "fulltext", label: "Full text" },
] as const;

type SearchMode = (typeof SEARCH_MODES)[number]["key"];

export default function SearchPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const q = searchParams.get("q") ?? "";
	const mode: SearchMode = (searchParams.get("mode") ??
		"contains") as SearchMode;
	const bottomRef = useRef<HTMLDivElement>(null);

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
		useInfiniteQuery({
			queryKey: ["search", q, mode],
			queryFn: ({ pageParam }) =>
				trpcClient.search.list.query({ q, mode, offset: pageParam }),
			initialPageParam: 0,
			getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
			enabled: q.length > 0,
		});

	useEffect(() => {
		const el = bottomRef.current;
		if (!el) {
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ threshold: 0.1 }
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const games = data?.pages.flatMap((p) => p.games) ?? [];

	return (
		<main className="@container h-full overflow-y-auto p-4">
			<div className="mb-4 flex items-center justify-between">
				<h1 className="text-lg">
					{q.length > 0 ? (
						<>
							Search results for <span className="font-medium">"{q}"</span>
						</>
					) : (
						"Search"
					)}
				</h1>
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
								onClick={() => setSearchParams({ q, mode: key })}
								type="button"
							>
								{label}
							</button>
						))}
					</div>
				)}
			</div>

			{q.length === 0 && (
				<div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
					<SearchIcon className="size-6" />
					<p>Type a game title to search.</p>
				</div>
			)}

			{q.length > 0 && status === "pending" && (
				<div className={GAME_GRID_CLASSNAME}>
					{Array.from({ length: 20 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
						<div key={i}>
							<Skeleton className="aspect-[3/4] w-full rounded-sm" />
							<Skeleton className="mt-1 h-4 w-3/4" />
						</div>
					))}
				</div>
			)}

			{status === "error" && (
				<div className="flex h-full items-center justify-center">
					<p className="text-muted-foreground">
						Failed to search games. Please try again.
					</p>
				</div>
			)}

			{status === "success" && games.length === 0 && (
				<div className="flex h-full items-center justify-center">
					<p className="text-muted-foreground">No games found for "{q}".</p>
				</div>
			)}

			{status === "success" && games.length > 0 && (
				<div className={GAME_GRID_CLASSNAME}>
					{games.map((game) => (
						<GameCard game={game} key={game.igdbId} />
					))}
				</div>
			)}

			<div className="py-4" ref={bottomRef}>
				{isFetchingNextPage && (
					<div className="flex justify-center">
						<div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
					</div>
				)}
				{status === "success" && !hasNextPage && games.length > 0 && (
					<p className="text-center text-muted-foreground text-xs">
						You've seen all results.
					</p>
				)}
			</div>
		</main>
	);
}
