import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@GameXL/ui/components/command";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useDebounceCallback } from "usehooks-ts";
import { useShallow } from "zustand/react/shallow";

import { SearchResultRow } from "@/components/search-result-row";
import { useSearchStore } from "@/stores/search-store";
import { trpcClient } from "@/utils/trpc";

const PREVIEW_LIMIT = 6;
const DEBOUNCE_MS = 300;

export function SearchCommandDialog() {
	const navigate = useNavigate();
	const {
		query,
		debouncedQuery,
		open,
		setQuery,
		setDebouncedQuery,
		setOpen,
		reset,
	} = useSearchStore(
		useShallow((s) => ({
			query: s.query,
			debouncedQuery: s.debouncedQuery,
			open: s.open,
			setQuery: s.setQuery,
			setDebouncedQuery: s.setDebouncedQuery,
			setOpen: s.setOpen,
			reset: s.reset,
		}))
	);
	const setDebouncedQueryDelayed = useDebounceCallback(
		setDebouncedQuery,
		DEBOUNCE_MS
	);

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				if (open) {
					reset();
				} else {
					setOpen(true);
				}
			}
		}
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [open, reset, setOpen]);

	const { data, isFetching } = useQuery({
		queryKey: ["search-preview", debouncedQuery],
		queryFn: () =>
			trpcClient.search.list.query({ q: debouncedQuery, offset: 0 }),
		enabled: debouncedQuery.length > 0,
	});

	const games = data?.games.slice(0, PREVIEW_LIMIT) ?? [];

	function goToResults(q: string) {
		if (!q.trim()) {
			return;
		}
		reset();
		navigate(`/search?q=${encodeURIComponent(q.trim())}`);
	}

	return (
		<CommandDialog
			onOpenChange={(next) => {
				if (next) {
					setOpen(true);
				} else {
					reset();
				}
			}}
			open={open}
			shouldFilter={false}
		>
			<CommandInput
				onKeyDown={(e) => {
					if (e.key === "Enter" && games.length === 0) {
						goToResults(query);
					}
				}}
				onValueChange={(value) => {
					setQuery(value);
					setDebouncedQueryDelayed(value.trim());
				}}
				placeholder="Search games..."
				value={query}
			/>
			<CommandList>
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
		</CommandDialog>
	);
}
