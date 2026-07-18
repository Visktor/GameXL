import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@GameXL/ui/components/command";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useDebounceCallback } from "usehooks-ts";
import { useShallow } from "zustand/react/shallow";

import { SearchResultRow } from "@/components/search-result-row";
import {
	GAME_STATUSES,
	GAME_STATUSES_ENUM,
	type GameStatus,
} from "@/constants/game-status";
import {
	resolveTrackedStatus,
	useTrackGameMutation,
} from "@/hooks/use-track-game-mutation";
import { useSearchStore } from "@/stores/search-store";
import { useTrackedGamesStore } from "@/stores/tracked-games-store";
import { trpcClient } from "@/utils/trpc";

const PREVIEW_LIMIT = 6;
const DEBOUNCE_MS = 300;

/**
 * Option/Alt+ArrowRight/ArrowLeft cycles the highlighted result
 * forward/backward through untracked → every status → back to untracked.
 * Ctrl+Arrow was tried first but macOS binds it to Mission Control
 * Space-switching by default, which eats the keystroke before the browser
 * sees it (asymmetrically, depending which Space you're on).
 */
const STATUS_CYCLE: (GameStatus | null)[] = [null, ...GAME_STATUSES];

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
	const { addMutation, removeMutation, toggleStatus } = useTrackGameMutation();
	const [highlightedGameId, setHighlightedGameId] = useState("");

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

	const games = useMemo(
		() => data?.games.slice(0, PREVIEW_LIMIT) ?? [],
		[data]
	);

	const highlightedGame = useMemo(
		() =>
			games.find((game) => game.igdbId === highlightedGameId) ??
			games[0] ??
			null,
		[games, highlightedGameId]
	);

	function goToResults(q: string) {
		if (!q.trim()) {
			return;
		}
		reset();
		navigate(`/search?q=${encodeURIComponent(q.trim())}`);
	}

	function goToGame(igdbId: string) {
		reset();
		navigate(`/games/${igdbId}`);
	}

	return (
		<CommandDialog
			className="max-w-lg gap-0 overflow-hidden rounded-2xl border-none p-0 shadow-2xl ring-1 ring-border"
			onOpenChange={(next) => {
				if (next) {
					setOpen(true);
				} else {
					reset();
				}
			}}
			onValueChange={setHighlightedGameId}
			open={open}
			shouldFilter={false}
			value={highlightedGame?.igdbId ?? ""}
		>
			<CommandInput
				onKeyDown={(e) => {
					const isMutating = addMutation.isPending || removeMutation.isPending;

					if (
						highlightedGame &&
						!isMutating &&
						(e.metaKey || e.ctrlKey) &&
						e.key === "Enter"
					) {
						e.preventDefault();
						e.stopPropagation();
						toggleStatus(highlightedGame, GAME_STATUSES_ENUM.WISHLIST);
						return;
					}

					if (
						highlightedGame &&
						!isMutating &&
						e.altKey &&
						!(e.metaKey || e.ctrlKey || e.shiftKey) &&
						(e.key === "ArrowRight" || e.key === "ArrowLeft")
					) {
						e.preventDefault();
						e.stopPropagation();
						const currentStatus = resolveTrackedStatus(
							highlightedGame,
							useTrackedGamesStore.getState().statusByGameId
						);
						const direction = e.key === "ArrowRight" ? 1 : -1;
						const nextIndex =
							(STATUS_CYCLE.indexOf(currentStatus) +
								direction +
								STATUS_CYCLE.length) %
							STATUS_CYCLE.length;
						const nextStatus = STATUS_CYCLE[nextIndex];
						if (nextStatus) {
							addMutation.mutate({ game: highlightedGame, status: nextStatus });
						} else {
							removeMutation.mutate({ game: highlightedGame });
						}
						return;
					}

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
			<CommandList className="max-h-96 p-2">
				{isFetching && games.length === 0 && (
					<div className="py-6 text-center text-muted-foreground text-xs">
						Searching...
					</div>
				)}
				{!isFetching && games.length === 0 && (
					<CommandEmpty>No games found.</CommandEmpty>
				)}
				{games.length > 0 && (
					<CommandGroup
						heading={
							<div className="flex w-full items-center justify-between">
								<span>Games</span>
								<button
									className="text-primary hover:underline"
									onClick={() => goToResults(query)}
									type="button"
								>
									See all results
								</button>
							</div>
						}
					>
						{games.map((game) => (
							<CommandItem
								className="rounded-lg px-2.5 py-2"
								key={game.igdbId}
								onSelect={() => goToGame(game.igdbId)}
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
