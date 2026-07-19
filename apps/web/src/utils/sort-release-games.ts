import type { ReleaseGame } from "@/components/game-card";

export type ReleaseGameSort = "release" | "score" | "title";

const COMPARATORS: Record<
	ReleaseGameSort,
	(a: ReleaseGame, b: ReleaseGame) => number
> = {
	title: (a, b) => a.title.localeCompare(b.title),
	release: (a, b) => (b.releaseDate ?? 0) - (a.releaseDate ?? 0),
	score: (a, b) => (b.igdbScore ?? 0) - (a.igdbScore ?? 0),
};

export function sortReleaseGames(
	games: ReleaseGame[],
	sort: ReleaseGameSort
): ReleaseGame[] {
	return [...games].sort(COMPARATORS[sort]);
}
