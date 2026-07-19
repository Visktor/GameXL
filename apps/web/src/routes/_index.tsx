import { useInfiniteQuery } from "@tanstack/react-query";
import {
	ArrowDownUp,
	Calendar,
	CalendarDays,
	CalendarRange,
	Clock,
	type LucideIcon,
	Star,
	TrendingUp,
	Trophy,
} from "lucide-react";
import { useSearchParams } from "react-router";

import { GameListView } from "@/components/game-list-view";
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

type Span = (typeof SPANS)[number]["key"];
type SortBy = (typeof SORTS)[number]["key"];

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

export default function ReleasesPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const span: Span = (searchParams.get("span") ?? "year") as Span;
	const sortBy: SortBy = (searchParams.get("sortBy") ?? "popularity") as SortBy;

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
		useInfiniteQuery({
			queryKey: ["releases", span, sortBy],
			queryFn: ({ pageParam }) =>
				trpcClient.releases.list.query({ span, sortBy, offset: pageParam }),
			initialPageParam: 0,
			getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
		});

	const games = data?.pages.flatMap((p) => p.games) ?? [];

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
			</div>

			{/* Main content */}
			<main className="@container flex-1 overflow-hidden p-4">
				<GameListView
					emptyState={
						<div className="flex h-full items-center justify-center">
							<p className="text-muted-foreground">
								No game releases for this period.
							</p>
						</div>
					}
					endMessage="You've seen all releases for this period."
					errorMessage="Failed to load releases. Please try again."
					fetchNextPage={fetchNextPage}
					games={games}
					hasNextPage={Boolean(hasNextPage)}
					isFetchingNextPage={isFetchingNextPage}
					status={status}
				/>
			</main>
		</div>
	);
}
