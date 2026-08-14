import { SEARCH_MODES } from "@GameXL/api/schemas/search-mode";

export type SearchMode = (typeof SEARCH_MODES)[number];

const SEARCH_MODE_LABELS: Record<SearchMode, string> = {
	contains: "Contains",
	fulltext: "Full text",
};

export const SEARCH_MODE_OPTIONS = SEARCH_MODES.map((value) => ({
	value,
	label: SEARCH_MODE_LABELS[value],
}));
