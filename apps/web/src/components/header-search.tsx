import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@GameXL/ui/components/command";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useDebounceCallback } from "usehooks-ts";

import { SearchResultRow } from "@/components/search-result-row";
import { useSearchStore } from "@/stores/search-store";
import { trpcClient } from "@/utils/trpc";

const PREVIEW_LIMIT = 6;
const DEBOUNCE_MS = 300;
const BLUR_CLOSE_DELAY_MS = 100;

export default function HeaderSearch() {
	const navigate = useNavigate();
	const query = useSearchStore((s) => s.query);
	const debouncedQuery = useSearchStore((s) => s.debouncedQuery);
	const open = useSearchStore((s) => s.open);
	const setQuery = useSearchStore((s) => s.setQuery);
	const setDebouncedQuery = useSearchStore((s) => s.setDebouncedQuery);
	const setOpen = useSearchStore((s) => s.setOpen);
	const setDebouncedQueryDelayed = useDebounceCallback(
		setDebouncedQuery,
		DEBOUNCE_MS
	);

	const { data, isFetching } = useQuery({
		queryKey: ["search-preview", debouncedQuery],
		queryFn: () =>
			trpcClient.search.list.query({ q: debouncedQuery, offset: 0 }),
		enabled: debouncedQuery.length > 0,
	});

	const games = data?.games.slice(0, PREVIEW_LIMIT) ?? [];
	const showList = open && debouncedQuery.length > 0;

	function goToResults(q: string) {
		if (!q.trim()) {
			return;
		}
		setOpen(false);
		navigate(`/search?q=${encodeURIComponent(q.trim())}`);
	}

	return (
		<Command
			className="relative flex-1 overflow-visible rounded-none bg-transparent"
			onKeyDown={(e) => {
				if (e.key === "Enter" && games.length === 0) {
					goToResults(query);
				}
				if (e.key === "Escape") {
					setOpen(false);
				}
			}}
			shouldFilter={false}
		>
			<CommandInput
				onBlur={() => setTimeout(() => setOpen(false), BLUR_CLOSE_DELAY_MS)}
				onFocus={() => setOpen(true)}
				onValueChange={(value) => {
					setQuery(value);
					setDebouncedQueryDelayed(value.trim());
					setOpen(true);
				}}
				placeholder="Search games..."
				value={query}
			/>
			{showList && (
				<CommandList className="absolute top-full left-0 z-50 mt-1 w-full rounded-none border bg-popover shadow-md ring-1 ring-foreground/10">
					{isFetching && games.length === 0 && (
						<div className="py-6 text-center text-muted-foreground text-xs">
							Searching...
						</div>
					)}
					{!isFetching && games.length === 0 && (
						<CommandEmpty>No games found.</CommandEmpty>
					)}
					{games.length > 0 && (
						<CommandGroup>
							{games.map((game) => (
								<CommandItem
									key={game.igdbId}
									onSelect={() => goToResults(game.title)}
									value={game.igdbId}
								>
									<SearchResultRow game={game} />
								</CommandItem>
							))}
						</CommandGroup>
					)}
				</CommandList>
			)}
		</Command>
	);
}
