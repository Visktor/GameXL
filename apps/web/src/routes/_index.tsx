import { Skeleton } from "@GameXL/ui/components/skeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Calendar, CalendarDays, CalendarRange, Clock } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

import { GameCard } from "@/components/game-card";
import { trpcClient } from "@/utils/trpc";

const SPANS = [
	{ key: "today", label: "Today", icon: Clock },
	{ key: "week", label: "This Week", icon: Calendar },
	{ key: "month", label: "This Month", icon: CalendarDays },
	{ key: "year", label: "This Year", icon: CalendarRange },
] as const;

type Span = (typeof SPANS)[number]["key"];

export default function ReleasesPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const span: Span = (searchParams.get("span") ?? "today") as Span;
	const bottomRef = useRef<HTMLDivElement>(null);

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
		useInfiniteQuery({
			queryKey: ["releases", span],
			queryFn: ({ pageParam }) =>
				trpcClient.releases.list.query({ span, offset: pageParam }),
			initialPageParam: 0,
			getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
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
		<div className="flex h-full overflow-hidden">
			{/* Sidebar */}
			<aside className="flex w-44 shrink-0 flex-col gap-1 border-r p-3">
				{SPANS.map(({ key, label, icon: Icon }) => (
					<button
						className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
							span === key ? "bg-accent font-medium" : "text-muted-foreground"
						}`}
						key={key}
						onClick={() => setSearchParams({ span: key })}
						type="button"
					>
						<Icon className="h-4 w-4 shrink-0" />
						{label}
					</button>
				))}
			</aside>

			{/* Main content */}
			<main className="flex-1 overflow-y-auto p-4">
				{status === "pending" && (
					<div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
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
							Failed to load releases. Please try again.
						</p>
					</div>
				)}

				{status === "success" && games.length === 0 && (
					<div className="flex h-full items-center justify-center">
						<p className="text-muted-foreground">
							No game releases for this period.
						</p>
					</div>
				)}

				{status === "success" && games.length > 0 && (
					<div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
						{games.map((game) => (
							<GameCard game={game} key={game.igdbId} />
						))}
					</div>
				)}

				{/* Infinite scroll sentinel */}
				<div className="py-4" ref={bottomRef}>
					{isFetchingNextPage && (
						<div className="flex justify-center">
							<div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
						</div>
					)}
					{status === "success" && !hasNextPage && games.length > 0 && (
						<p className="text-center text-muted-foreground text-xs">
							You've seen all releases for this period.
						</p>
					)}
				</div>
			</main>
		</div>
	);
}
