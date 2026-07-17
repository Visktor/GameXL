import { DEFAULT_PAGE_SIZE } from "@GameXL/api/utils/pagination";
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
	type LucideIcon,
	Star,
	TrendingUp,
	Trophy,
} from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { type ListRange, Virtuoso, VirtuosoGrid } from "react-virtuoso";

import { GameCard } from "@/components/game-card";
import { GAME_GRID_CLASSNAME } from "@/constants/game-grid";
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

const SIDEBAR_BUTTON_CLASSNAME =
	"flex items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent";
const PILL_BUTTON_CLASSNAME =
	"flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors";

function NavButton({
	icon: Icon,
	isActive,
	label,
	onClick,
	variant,
}: {
	icon: LucideIcon;
	isActive: boolean;
	label: string;
	onClick: () => void;
	variant: "pill" | "sidebar";
}) {
	const isSidebar = variant === "sidebar";
	const activeClassName = isSidebar
		? "bg-accent font-medium"
		: "border-foreground bg-accent font-medium";

	return (
		<button
			className={`${isSidebar ? SIDEBAR_BUTTON_CLASSNAME : PILL_BUTTON_CLASSNAME} ${
				isActive ? activeClassName : "text-muted-foreground"
			}`}
			onClick={onClick}
			type="button"
		>
			<Icon
				className={isSidebar ? "h-4 w-4 shrink-0" : "h-3.5 w-3.5 shrink-0"}
			/>
			{label}
		</button>
	);
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
	const span: Span = (searchParams.get("span") ?? "year") as Span;
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

	// Warm the browser's image cache for a newly-arrived page before its cards
	// mount, so decode is already done by the time the user scrolls to them.
	useEffect(() => {
		const lastPage = data?.pages.at(-1);
		if (!lastPage) {
			return;
		}
		for (const game of lastPage.games) {
			if (game.coverUrl) {
				const preloadImage = new Image();
				preloadImage.src = game.coverUrl;
			}
		}
	}, [data]);

	const handleEndReached = () => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	};

	// Fires well before endReached (which only accounts for render overscan):
	// once the rendered range is within a full page of the loaded end, fetch
	// the next page so fast/fling scrolling doesn't outrun the network.
	const handleRangeChanged = ({ endIndex }: ListRange) => {
		const itemsRemaining = games.length - endIndex;
		if (
			itemsRemaining <= DEFAULT_PAGE_SIZE &&
			hasNextPage &&
			!isFetchingNextPage
		) {
			fetchNextPage();
		}
	};

	const loadMoreContext: LoadMoreContext = {
		hasGames: games.length > 0,
		hasNextPage: Boolean(hasNextPage),
		isFetchingNextPage,
	};

	return (
		<div className="flex h-full flex-col overflow-hidden lg:flex-row">
			{/* Sidebar (lg and up) */}
			<aside className="hidden shrink-0 flex-col gap-1 border-r p-3 lg:flex lg:w-44">
				{SPANS.map(({ key, label, icon }) => (
					<NavButton
						icon={icon}
						isActive={span === key}
						key={key}
						label={label}
						onClick={() => setSearchParams({ span: key, sortBy })}
						variant="sidebar"
					/>
				))}
				<div className="my-2 border-t" />
				<p className="px-3 pb-1 text-muted-foreground text-xs">Sort by</p>
				{SORTS.map(({ key, label, icon }) => (
					<NavButton
						icon={icon}
						isActive={sortBy === key}
						key={key}
						label={label}
						onClick={() => setSearchParams({ span, sortBy: key })}
						variant="sidebar"
					/>
				))}
				<div className="my-2 border-t" />
				<p className="px-3 pb-1 text-muted-foreground text-xs">View</p>
				{LAYOUTS.map(({ key, label, icon }) => (
					<NavButton
						icon={icon}
						isActive={layout === key}
						key={key}
						label={label}
						onClick={() => setLayout(key)}
						variant="sidebar"
					/>
				))}
			</aside>

			{/* Filter bar (below lg) */}
			<div className="flex shrink-0 gap-2 overflow-x-auto border-b p-3 lg:hidden">
				{SPANS.map(({ key, label, icon }) => (
					<NavButton
						icon={icon}
						isActive={span === key}
						key={key}
						label={label}
						onClick={() => setSearchParams({ span: key, sortBy })}
						variant="pill"
					/>
				))}
				<div className="mx-1 w-px shrink-0 bg-border" />
				{SORTS.map(({ key, label, icon }) => (
					<NavButton
						icon={icon}
						isActive={sortBy === key}
						key={key}
						label={label}
						onClick={() => setSearchParams({ span, sortBy: key })}
						variant="pill"
					/>
				))}
				<div className="mx-1 w-px shrink-0 bg-border" />
				{LAYOUTS.map(({ key, label, icon }) => (
					<NavButton
						icon={icon}
						isActive={layout === key}
						key={key}
						label={label}
						onClick={() => setLayout(key)}
						variant="pill"
					/>
				))}
			</div>

			{/* Main content */}
			<main className="flex-1 overflow-hidden p-4">
				{status === "pending" && layout === "grid" && (
					<div className="h-full overflow-y-auto">
						<div className={GAME_GRID_CLASSNAME}>
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
						computeItemKey={(index) => games[index].igdbId}
						context={loadMoreContext}
						endReached={handleEndReached}
						itemContent={(index) => (
							<GameCard
								game={games[index]}
								imagePriority={index < DEFAULT_PAGE_SIZE ? "high" : "low"}
								layout="grid"
							/>
						)}
						listClassName={GAME_GRID_CLASSNAME}
						overscan={SCROLL_OVERSCAN_PX}
						rangeChanged={handleRangeChanged}
						style={{ height: "100%", scrollbarGutter: "stable" }}
						totalCount={games.length}
					/>
				)}

				{status === "success" && games.length > 0 && layout === "list" && (
					<Virtuoso
						components={{ Footer: LoadMoreFooter }}
						computeItemKey={(index) => games[index].igdbId}
						context={loadMoreContext}
						endReached={handleEndReached}
						increaseViewportBy={{
							bottom: SCROLL_OVERSCAN_PX,
							top: SCROLL_OVERSCAN_PX,
						}}
						itemContent={(index) => (
							<GameCard
								game={games[index]}
								imagePriority={index < DEFAULT_PAGE_SIZE ? "high" : "low"}
								layout="list"
							/>
						)}
						rangeChanged={handleRangeChanged}
						style={{ height: "100%" }}
						totalCount={games.length}
					/>
				)}
			</main>
		</div>
	);
}
