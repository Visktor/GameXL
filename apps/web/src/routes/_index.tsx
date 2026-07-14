import { Skeleton } from "@GameXL/ui/components/skeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
	ArrowDownUp,
	Calendar,
	CalendarDays,
	CalendarRange,
	Clock,
	LayoutGrid,
	List,
	Star,
	TrendingUp,
	Trophy,
} from "lucide-react";
import { useSearchParams } from "react-router";
import { Virtuoso, VirtuosoGrid } from "react-virtuoso";

import { GameCard } from "@/components/game-card";
import { useViewPreferenceStore } from "@/stores/view-preference-store";
import { trpcClient } from "@/utils/trpc";

const SPANS = [
	{ key: "year", label: "This Year", icon: CalendarRange },
	{ key: "month", label: "30 Days", icon: CalendarDays },
	{ key: "week", label: "This Week", icon: Calendar },
	{ key: "today", label: "Today", icon: Clock },
] as const;

const SORTS = [
	{ key: "popularity", label: "Popularity", icon: TrendingUp },
	{ key: "date", label: "Release Date", icon: ArrowDownUp },
	{ key: "rating", label: "Rating", icon: Star },
	{ key: "score", label: "Top Score", icon: Trophy },
] as const;

const LAYOUTS = [
	{ key: "grid", label: "Grid", icon: LayoutGrid },
	{ key: "list", label: "List", icon: List },
] as const;

type Span = (typeof SPANS)[number]["key"];
type SortBy = (typeof SORTS)[number]["key"];

// Renders items well outside the viewport so they stay mounted across scroll,
// preventing covers from unmounting/remounting (and visibly flickering) as
// virtuoso recycles offscreen rows.
const SCROLL_OVERSCAN_PX = 800;

interface LoadMoreContext {
	hasGames: boolean;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
}

function LoadMoreFooter({ context }: { context: LoadMoreContext }) {
	const { hasGames, hasNextPage, isFetchingNextPage } = context;
	return (
		<div className="py-4">
			{isFetchingNextPage && (
				<div className="flex justify-center">
					<div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
				</div>
			)}
			{!hasNextPage && hasGames && (
				<p className="text-center text-muted-foreground text-xs">
					You've seen all releases for this period.
				</p>
			)}
		</div>
	);
}

export default function ReleasesPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const span: Span = (searchParams.get("span") ?? "today") as Span;
	const sortBy: SortBy = (searchParams.get("sortBy") ?? "popularity") as SortBy;
	const layout = useViewPreferenceStore((s) => s.layout);
	const setLayout = useViewPreferenceStore((s) => s.setLayout);

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
		useInfiniteQuery({
			queryKey: ["releases", span, sortBy],
			queryFn: ({ pageParam }) =>
				trpcClient.releases.list.query({ span, sortBy, offset: pageParam }),
			initialPageParam: 0,
			getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
		});

	const games = data?.pages.flatMap((p) => p.games) ?? [];

	const handleEndReached = () => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	};

	const loadMoreContext: LoadMoreContext = {
		hasGames: games.length > 0,
		hasNextPage: Boolean(hasNextPage),
		isFetchingNextPage,
	};

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
						onClick={() => setSearchParams({ span: key, sortBy })}
						type="button"
					>
						<Icon className="h-4 w-4 shrink-0" />
						{label}
					</button>
				))}
				<div className="my-2 border-t" />
				<p className="px-3 pb-1 text-muted-foreground text-xs">Sort by</p>
				{SORTS.map(({ key, label, icon: Icon }) => (
					<button
						className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
							sortBy === key ? "bg-accent font-medium" : "text-muted-foreground"
						}`}
						key={key}
						onClick={() => setSearchParams({ span, sortBy: key })}
						type="button"
					>
						<Icon className="h-4 w-4 shrink-0" />
						{label}
					</button>
				))}
				<div className="my-2 border-t" />
				<p className="px-3 pb-1 text-muted-foreground text-xs">View</p>
				{LAYOUTS.map(({ key, label, icon: Icon }) => (
					<button
						className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
							layout === key ? "bg-accent font-medium" : "text-muted-foreground"
						}`}
						key={key}
						onClick={() => setLayout(key)}
						type="button"
					>
						<Icon className="h-4 w-4 shrink-0" />
						{label}
					</button>
				))}
			</aside>

			{/* Main content */}
			<main className="flex-1 overflow-hidden p-4">
				{status === "pending" && layout === "grid" && (
					<div className="h-full overflow-y-auto">
						<div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
							{Array.from({ length: 20 }).map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
								<div key={i}>
									<Skeleton className="aspect-[3/4] w-full rounded-sm" />
									<Skeleton className="mt-1 h-4 w-3/4" />
								</div>
							))}
						</div>
					</div>
				)}

				{status === "pending" && layout === "list" && (
					<div className="h-full overflow-y-auto">
						<div className="flex flex-col">
							{Array.from({ length: 12 }).map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
								<div className="flex items-center gap-3 border-b py-2" key={i}>
									<Skeleton className="aspect-3/4 h-16 w-12 shrink-0 rounded-sm" />
									<Skeleton className="h-4 w-1/3" />
								</div>
							))}
						</div>
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

				{status === "success" && games.length > 0 && layout === "grid" && (
					<VirtuosoGrid
						components={{ Footer: LoadMoreFooter }}
						context={loadMoreContext}
						endReached={handleEndReached}
						itemContent={(index) => (
							<GameCard game={games[index]} layout="grid" />
						)}
						listClassName="grid grid-cols-2 gap-4 sm:grid-cols-5"
						overscan={SCROLL_OVERSCAN_PX}
						style={{ height: "100%", scrollbarGutter: "stable" }}
						totalCount={games.length}
					/>
				)}

				{status === "success" && games.length > 0 && layout === "list" && (
					<Virtuoso
						components={{ Footer: LoadMoreFooter }}
						context={loadMoreContext}
						endReached={handleEndReached}
						increaseViewportBy={{
							bottom: SCROLL_OVERSCAN_PX,
							top: SCROLL_OVERSCAN_PX,
						}}
						itemContent={(index) => (
							<GameCard game={games[index]} layout="list" />
						)}
						style={{ height: "100%" }}
						totalCount={games.length}
					/>
				)}
			</main>
		</div>
	);
}
