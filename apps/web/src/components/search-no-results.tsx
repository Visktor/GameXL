import { Button } from "@GameXL/ui/components/button";
import { SearchIcon } from "lucide-react";

export function SearchNoResults({
	onClearFilters,
	query,
}: {
	onClearFilters: () => void;
	query: string;
}) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 text-center">
			<SearchIcon className="size-8 text-muted-foreground" />
			<p className="font-medium text-sm">No games found</p>
			<p className="max-w-xs text-muted-foreground text-xs">
				{query
					? `No results for "${query}". Try a different search term, or clear your filters.`
					: "Try a different search term, or clear your filters."}
			</p>
			<Button
				className="mt-1"
				onClick={onClearFilters}
				size="sm"
				variant="secondary"
			>
				Clear filters
			</Button>
		</div>
	);
}
