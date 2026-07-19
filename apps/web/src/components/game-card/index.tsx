import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@GameXL/ui/components/hover-card";
import { useState } from "react";

import { StatusButtonGroup } from "@/components/status-button-group";
import { WishlistButton } from "@/components/wishlist-button";
import {
	GAME_STATUS_META,
	GAME_STATUSES_ENUM,
	type GameStatus,
	TRACK_STATUSES,
} from "@/constants/game-status";
import {
	resolveTrackedStatus,
	useTrackGameMutation,
} from "@/hooks/use-track-game-mutation";
import { useAutoplayPreferenceStore } from "@/stores/autoplay-preference-store";
import { useGamePreviewPanelStore } from "@/stores/game-preview-panel-store";
import { useTrackedGamesStore } from "@/stores/tracked-games-store";
import { GameCardGridBody } from "./game-card-grid-body";
import { GameCardListBody } from "./game-card-list-body";
import { GameCardStatusRow } from "./game-card-status-row";
import { HoverPreviewMedia } from "./hover-preview-media";
import type { ReleaseGame } from "./types";

export type { ReleaseGame } from "./types";

export function GameCard({
	game,
	imagePriority = "auto",
	layout = "grid",
	readOnly = false,
}: {
	game: ReleaseGame;
	/** Hints the browser's fetch priority for the cover image. "high" for
	 * above-the-fold cards, "low" for cards preloaded ahead of scroll. */
	imagePriority?: "auto" | "high" | "low";
	layout?: "grid" | "list";
	/** Viewing someone else's list: show status as a badge, no edit controls. */
	readOnly?: boolean;
}) {
	const isList = layout === "list";
	const [isHoverCardOpen, setIsHoverCardOpen] = useState(false);

	const autoplayTrailers = useAutoplayPreferenceStore(
		(state) => state.autoplayTrailers
	);
	const openPreviewPanel = useGamePreviewPanelStore((state) => state.open);

	const handleCoverClick = (e: React.MouseEvent) => {
		if (e.metaKey || e.ctrlKey || e.button === 1) {
			return;
		}
		e.preventDefault();
		openPreviewPanel(game.igdbId);
	};

	const storeStatus = useTrackedGamesStore((state) =>
		resolveTrackedStatus(game, state.statusByGameId)
	);
	const trackedStatus = readOnly ? game.trackedStatus : storeStatus;

	const { addMutation, removeMutation } = useTrackGameMutation();

	const isFavoritePending = addMutation.isPending || removeMutation.isPending;
	const handleToggleFavorite = () => {
		if (trackedStatus === GAME_STATUSES_ENUM.WISHLIST) {
			removeMutation.mutate({ game });
		} else {
			addMutation.mutate({ game, status: GAME_STATUSES_ENUM.WISHLIST });
		}
	};
	const handleQuickAddStatus = (status: GameStatus) =>
		addMutation.mutate({ game, status });

	const statusRow = (
		<GameCardStatusRow
			isList={isList}
			isQuickAddPending={addMutation.isPending}
			isRemovePending={removeMutation.isPending}
			onQuickAddStatus={handleQuickAddStatus}
			onRemoveStatus={() => removeMutation.mutate({ game })}
			readOnly={readOnly}
			score={game.igdbScore}
			trackedStatus={trackedStatus}
		/>
	);

	return (
		<HoverCard onOpenChange={setIsHoverCardOpen}>
			<HoverCardTrigger
				closeDelay={150}
				delay={300}
				render={
					<div
						className={
							isList
								? "group flex items-center gap-3 border-b py-2 last:border-b-0"
								: "group block"
						}
					/>
				}
			>
				{isList ? (
					<GameCardListBody
						game={game}
						imagePriority={imagePriority}
						onCoverClick={handleCoverClick}
					>
						{statusRow}
					</GameCardListBody>
				) : (
					<GameCardGridBody
						game={game}
						imagePriority={imagePriority}
						onCoverClick={handleCoverClick}
					>
						{statusRow}
					</GameCardGridBody>
				)}
			</HoverCardTrigger>
			<HoverCardContent className="w-140 p-0" side="right">
				{autoplayTrailers && (
					<HoverPreviewMedia game={game} isOpen={isHoverCardOpen} />
				)}

				{/* Scores + actions */}
				<div className="p-3">
					<div className="mb-3 flex items-center gap-2 text-sm">
						<WishlistButton
							isPending={isFavoritePending}
							onToggle={handleToggleFavorite}
							readOnly={readOnly}
							trackedStatus={trackedStatus}
						/>

						{game.igdbScore === null ? (
							<span className="text-muted-foreground text-xs">
								No IGDB score
							</span>
						) : (
							<span className="text-muted-foreground">
								IGDB{" "}
								<span className="font-medium text-foreground">
									{Math.round(game.igdbScore)}
								</span>
							</span>
						)}
					</div>

					<div className="flex flex-wrap items-center gap-1.5">
						{readOnly ? (
							trackedStatus &&
							trackedStatus !== GAME_STATUSES_ENUM.WISHLIST && (
								<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
									{(() => {
										const { icon: Icon, label } =
											GAME_STATUS_META[trackedStatus];
										return (
											<>
												<Icon className="h-4 w-4" />
												{label}
											</>
										);
									})()}
								</span>
							)
						) : (
							<StatusButtonGroup
								disabled={isFavoritePending}
								onChange={(status) =>
									status
										? addMutation.mutate({ game, status })
										: removeMutation.mutate({ game })
								}
								statuses={TRACK_STATUSES}
								value={trackedStatus}
							/>
						)}
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
