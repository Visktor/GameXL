import type { ReleaseGame } from "@/components/game-card";

export type ReleaseGameSort = "release" | "score" | "title";

export function sortReleaseGames(
	games: ReleaseGame[],
	sort: ReleaseGameSort
): ReleaseGame[] {
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
			break;
	}

	return sorted;
}
