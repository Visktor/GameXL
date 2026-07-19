import type { ReleaseGameSort } from "@/utils/sort-release-games";

export const LIST_SORT_OPTIONS: ReleaseGameSort[] = [
	"title",
	"release",
	"score",
];

export const LIST_SORT_LABELS: Record<ReleaseGameSort, string> = {
	title: "Title (A-Z)",
	release: "Release Date",
	score: "IGDB Score",
};
