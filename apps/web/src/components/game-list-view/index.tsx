import { DEFAULT_PAGE_SIZE } from "@GameXL/api/utils/pagination";
import { Skeleton } from "@GameXL/ui/components/skeleton";
import { useEffect, useRef } from "react";
import { type ListRange, Virtuoso, VirtuosoGrid } from "react-virtuoso";

import { GameCard, type ReleaseGame } from "@/components/game-card";
import { GAME_GRID_CLASSNAME } from "@/constants/game-grid";
import { useViewPreferenceStore } from "@/stores/view-preference-store";
import { ViewToggle } from "./view-toggle";

// Renders items well outside the viewport so they stay mounted across scroll,
// preventing covers from unmounting/remounting (and visibly flickering) as
// virtuoso recycles offscreen rows.
const SCROLL_OVERSCAN_PX = 800;
const GRID_SKELETON_COUNT = 20;
const LIST_SKELETON_COUNT = 12;
const DEFAULT_ERROR_MESSAGE = "Failed to load games. Please try again.";

interface LoadMoreContext {
	endMessage?: string;
	hasGames: boolean;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
}

function LoadMoreFooter({ context }: { context: LoadMoreContext }) {
	const { endMessage, hasGames, hasNextPage, isFetchingNextPage } = context;
	return (
		<div className="py-4">
			{isFetchingNextPage && (
				<div className="flex justify-center">
					<div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
				</div>
			)}
			{!hasNextPage && hasGames && endMessage && (
				<p className="text-center text-muted-foreground text-xs">
					{endMessage}
				</p>
			)}
		</div>
	);
}

export interface GameListViewProps {
	/** Rendered when the fetch succeeded but returned zero games. */
	emptyState: React.ReactNode;
	/** Footer copy shown once every page has loaded. Omit for no message. */
	endMessage?: string;
	errorMessage?: string;
	fetchNextPage: () => void;
	games: ReleaseGame[];
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	/** Viewing someone else's list: show status as a badge, no edit controls. */
	readOnly?: boolean;
	status: "error" | "pending" | "success";
}

export function GameListView({
	emptyState,
	endMessage,
	errorMessage = DEFAULT_ERROR_MESSAGE,
	fetchNextPage,
	games,
	hasNextPage,
	isFetchingNextPage,
	readOnly = false,
	status,
}: GameListViewProps) {
	const layout = useViewPreferenceStore((s) => s.layout);

	// Warm the browser's image cache for newly-arrived games before their
	// cards mount, so decode is already done by the time the user scrolls to them.
	useEffect(() => {
		for (const game of games) {
			if (game.coverUrl) {
				const preloadImage = new Image();
				preloadImage.src = game.coverUrl;
			}
		}
	}, [games]);

	// Virtuoso can call rangeChanged (and, on fast scrolls, both rangeChanged
	// and endReached) more than once before React re-renders with the updated
	// isFetchingNextPage prop, so a plain `!isFetchingNextPage` check race
	// -- two calls can both see it as false and each fire fetchNextPage(),
	// sending duplicate requests for the same page. A ref flips synchronously
	// (no render round-trip needed) so the second call always sees the first
	// call's in-flight state.
	const isRequestingNextPageRef = useRef(false);

	useEffect(() => {
		if (!isFetchingNextPage) {
			isRequestingNextPageRef.current = false;
		}
	}, [isFetchingNextPage]);

	const requestNextPage = () => {
		if (!hasNextPage || isRequestingNextPageRef.current) {
			return;
		}
		isRequestingNextPageRef.current = true;
		fetchNextPage();
	};

	const handleEndReached = () => {
		requestNextPage();
	};

	// Fires well before endReached (which only accounts for render overscan):
	// once the rendered range is within a full page of the loaded end, fetch
	// the next page so fast/fling scrolling doesn't outrun the network.
	const handleRangeChanged = ({ endIndex }: ListRange) => {
		const itemsRemaining = games.length - endIndex;
		if (itemsRemaining <= DEFAULT_PAGE_SIZE) {
			requestNextPage();
		}
	};

	const loadMoreContext: LoadMoreContext = {
		endMessage,
		hasGames: games.length > 0,
		hasNextPage,
		isFetchingNextPage,
	};

	return (
		<div className="flex h-full flex-col">
			<div className="flex shrink-0 justify-end pb-2">
				<ViewToggle />
			</div>

			<div className="flex-1 overflow-hidden">
				{status === "pending" && layout === "grid" && (
					<div className="h-full overflow-y-auto">
						<div className={GAME_GRID_CLASSNAME}>
							{Array.from({ length: GRID_SKELETON_COUNT }).map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
								<div key={i}>
									<Skeleton className="aspect-[3/4] w-full rounded-sm" />
									<Skeleton className="mt-1 h-4 w-3/4" />
								</div>
							))}
						</div>
					</div>
				)}

				{status === "pending" && layout === "list" && (
					<div className="h-full overflow-y-auto">
						<div className="flex flex-col">
							{Array.from({ length: LIST_SKELETON_COUNT }).map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
								<div className="flex items-center gap-3 border-b py-2" key={i}>
									<Skeleton className="aspect-3/4 h-16 w-12 shrink-0 rounded-sm" />
									<Skeleton className="h-4 w-1/3" />
								</div>
							))}
						</div>
					</div>
				)}

				{status === "error" && (
					<div className="flex h-full items-center justify-center">
						<p className="text-muted-foreground">{errorMessage}</p>
					</div>
				)}

				{status === "success" && games.length === 0 && emptyState}

				{status === "success" && games.length > 0 && layout === "grid" && (
					<VirtuosoGrid
						components={{ Footer: LoadMoreFooter }}
						computeItemKey={(index) => games[index].igdbId}
						context={loadMoreContext}
						endReached={handleEndReached}
						itemContent={(index) => (
							<GameCard
								game={games[index]}
								imagePriority={index < DEFAULT_PAGE_SIZE ? "high" : "low"}
								layout="grid"
								readOnly={readOnly}
							/>
						)}
						listClassName={GAME_GRID_CLASSNAME}
						overscan={SCROLL_OVERSCAN_PX}
						rangeChanged={handleRangeChanged}
						style={{ height: "100%", scrollbarGutter: "stable" }}
						totalCount={games.length}
					/>
				)}

				{status === "success" && games.length > 0 && layout === "list" && (
					<Virtuoso
						components={{ Footer: LoadMoreFooter }}
						computeItemKey={(index) => games[index].igdbId}
						context={loadMoreContext}
						endReached={handleEndReached}
						increaseViewportBy={{
							bottom: SCROLL_OVERSCAN_PX,
							top: SCROLL_OVERSCAN_PX,
						}}
						itemContent={(index) => (
							<GameCard
								game={games[index]}
								imagePriority={index < DEFAULT_PAGE_SIZE ? "high" : "low"}
								layout="list"
								readOnly={readOnly}
							/>
						)}
						rangeChanged={handleRangeChanged}
						style={{ height: "100%" }}
						totalCount={games.length}
					/>
				)}
			</div>
		</div>
	);
}
