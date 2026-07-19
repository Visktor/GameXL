export const SORT_OPTIONS = [
	{ value: "popularity", label: "Popularity" },
	{ value: "rating", label: "Rating" },
	{ value: "recent", label: "Recently added" },
	{ value: "az", label: "A–Z" },
] as const;

export type SearchSortBy = (typeof SORT_OPTIONS)[number]["value"];
