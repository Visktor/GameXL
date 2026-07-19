import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@GameXL/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@GameXL/ui/components/tabs";
import { useMemo, useState } from "react";
import type { ReleaseGame } from "@/components/game-card";
import { GameListView } from "@/components/game-list-view";
import { GAME_STATUS_META, GAME_STATUSES } from "@/constants/game-status";
import { sortReleaseGames } from "@/utils/sort-release-games";

// GameList's data is a fully-loaded, non-paginated array — nothing to fetch.
const NO_OP = () => undefined;

const TABS = ["ALL", ...GAME_STATUSES] as const;
type TabValue = (typeof TABS)[number];

const TAB_LABELS: Record<TabValue, string> = {
	ALL: "All",
	...Object.fromEntries(
		GAME_STATUSES.map((status) => [status, GAME_STATUS_META[status].label])
	),
} as Record<TabValue, string>;

const SORT_OPTIONS = ["updated", "title", "release", "score"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const SORT_LABELS: Record<SortOption, string> = {
	updated: "Recently Updated",
	title: "Title (A-Z)",
	release: "Release Date",
	score: "IGDB Score",
};

function sortGames(games: ReleaseGame[], sort: SortOption): ReleaseGame[] {
	if (sort === "updated") {
		return [...games].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
	}

	return sortReleaseGames(games, sort);
}

interface GameListProps {
	games: ReleaseGame[];
	readOnly?: boolean;
}

export function GameList({ games, readOnly = false }: GameListProps) {
	const [tab, setTab] = useState<TabValue>("ALL");
	const [sort, setSort] = useState<SortOption>("updated");

	const countByTab = useMemo(() => {
		const counts: Record<TabValue, number> = {
			ALL: games.length,
			PLAYING: 0,
			COMPLETED: 0,
			ON_HOLD: 0,
			DROPPED: 0,
			WISHLIST: 0,
		};
		for (const game of games) {
			if (game.trackedStatus) {
				counts[game.trackedStatus] += 1;
			}
		}
		return counts;
	}, [games]);

	const visibleGames = useMemo(() => {
		const filtered =
			tab === "ALL" ? games : games.filter((g) => g.trackedStatus === tab);
		return sortGames(filtered, sort);
	}, [games, tab, sort]);

	return (
		<div className="flex h-full flex-col gap-4">
			<div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
				<Tabs onValueChange={(value) => setTab(value as TabValue)} value={tab}>
					<TabsList>
						{TABS.map((value) => (
							<TabsTrigger key={value} value={value}>
								{TAB_LABELS[value]} ({countByTab[value]})
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				<Select
					onValueChange={(value) => setSort(value as SortOption)}
					value={sort}
				>
					<SelectTrigger size="sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{SORT_OPTIONS.map((option) => (
							<SelectItem key={option} value={option}>
								{SORT_LABELS[option]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex-1 overflow-hidden">
				<GameListView
					emptyState={
						<p className="py-12 text-center text-muted-foreground text-sm">
							Nothing here yet.
						</p>
					}
					fetchNextPage={NO_OP}
					games={visibleGames}
					hasNextPage={false}
					isFetchingNextPage={false}
					readOnly={readOnly}
					status="success"
				/>
			</div>
		</div>
	);
}
