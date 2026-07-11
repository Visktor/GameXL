import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@GameXL/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@GameXL/ui/components/tabs";
import { useMemo, useState } from "react";

import { GameCard, type ReleaseGame } from "@/components/game-card";
import { GAME_STATUS_META, GAME_STATUSES } from "@/constants/game-status";

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
	const sorted = [...games];

	switch (sort) {
		case "title":
			sorted.sort((a, b) => a.title.localeCompare(b.title));
			break;
		case "release":
			sorted.sort((a, b) => (b.releaseDate ?? 0) - (a.releaseDate ?? 0));
			break;
		case "score":
			sorted.sort((a, b) => (b.igdbScore ?? 0) - (a.igdbScore ?? 0));
			break;
		default:
			sorted.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
	}

	return sorted;
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
			WANT: 0,
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
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
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

			{visibleGames.length === 0 ? (
				<p className="py-12 text-center text-muted-foreground text-sm">
					Nothing here yet.
				</p>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{visibleGames.map((game) => (
						<GameCard game={game} key={game.igdbId} readOnly={readOnly} />
					))}
				</div>
			)}
		</div>
	);
}
