import { Input } from "@GameXL/ui/components/input";
import { SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useDebounceCallback } from "usehooks-ts";

import type { ReleaseGame } from "@/components/game-card";
import { SearchResultRow } from "@/components/search-result-row";

const DEBOUNCE_MS = 300;
const TYPEAHEAD_LIMIT = 6;
// Lets a click on a typeahead row register before blur hides the dropdown.
const BLUR_HIDE_DELAY_MS = 120;

export function SearchInput({
	initialQuery,
	onQueryChange,
	typeaheadResults,
}: {
	initialQuery: string;
	onQueryChange: (query: string) => void;
	typeaheadResults: ReleaseGame[];
}) {
	const [value, setValue] = useState(initialQuery);
	const [focused, setFocused] = useState(false);
	const debouncedOnQueryChange = useDebounceCallback(
		onQueryChange,
		DEBOUNCE_MS
	);

	const handleChange = (next: string) => {
		setValue(next);
		debouncedOnQueryChange(next.trim());
	};

	const handleClear = () => {
		setValue("");
		onQueryChange("");
	};

	const showTypeahead = focused && value.trim().length > 0;

	return (
		<div className="relative max-w-lg flex-1">
			<SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				className="pr-8 pl-8"
				onBlur={() => setTimeout(() => setFocused(false), BLUR_HIDE_DELAY_MS)}
				onChange={(e) => handleChange(e.target.value)}
				onFocus={() => setFocused(true)}
				placeholder="Search games…"
				value={value}
			/>
			{value.length > 0 && (
				<button
					aria-label="Clear search"
					className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					onClick={handleClear}
					type="button"
				>
					<XIcon className="size-3.5" />
				</button>
			)}
			{showTypeahead && (
				<div className="absolute top-[calc(100%+6px)] right-0 left-0 z-10 overflow-hidden rounded-none border bg-popover shadow-md">
					{typeaheadResults.length === 0 ? (
						<p className="px-3 py-4 text-center text-muted-foreground text-xs">
							No matches
						</p>
					) : (
						typeaheadResults.slice(0, TYPEAHEAD_LIMIT).map((game) => (
							<Link
								className="block border-b px-3 py-2 last:border-b-0 hover:bg-accent"
								key={game.igdbId}
								to={`/games/${game.igdbId}`}
							>
								<SearchResultRow game={game} />
							</Link>
						))
					)}
				</div>
			)}
		</div>
	);
}
