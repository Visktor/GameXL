import { Input } from "@GameXL/ui/components/input";
import { SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

const DEBOUNCE_MS = 300;

export function SearchInput({
	initialQuery,
	onQueryChange,
}: {
	initialQuery: string;
	onQueryChange: (query: string) => void;
}) {
	const [value, setValue] = useState(initialQuery);
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

	return (
		<div className="relative max-w-lg flex-1">
			<SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				className="pr-8 pl-8"
				onChange={(e) => handleChange(e.target.value)}
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
		</div>
	);
}
