import type { ReleaseGame } from "@/components/game-card";
import { StarRating } from "@/components/star-rating";
import { StatusSelect } from "@/components/status-select";
import { WishlistButton } from "@/components/wishlist-button";
import { GAME_STATUSES_ENUM } from "@/constants/game-status";
import {
	resolveTrackedStatus,
	useTrackGameMutation,
} from "@/hooks/use-track-game-mutation";
import { useTrackedGamesStore } from "@/stores/tracked-games-store";

const RATING_SCALE = 20;

export function SearchResultRow({ game }: { game: ReleaseGame }) {
	const year = game.releaseDate
		? new Date(game.releaseDate * 1000).getFullYear()
		: null;

	const trackedStatus = useTrackedGamesStore((state) =>
		resolveTrackedStatus(game, state.statusByGameId)
	);
	const { addMutation, removeMutation, toggleStatus } = useTrackGameMutation();
	const isPending = addMutation.isPending || removeMutation.isPending;

	return (
		<div className="flex w-full items-center gap-3">
			<div className="aspect-3/4 h-12 shrink-0 overflow-hidden rounded-md bg-muted">
				{game.coverUrl ? (
					<img
						alt={game.title}
						className="h-full w-full object-cover"
						height={64}
						src={game.coverUrl}
						width={48}
					/>
				) : null}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm">{game.title}</p>
				<div className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
					{game.igdbScore !== null && (
						<>
							<StarRating score={game.igdbScore} />
							<span>{(game.igdbScore / RATING_SCALE).toFixed(1)}</span>
						</>
					)}
					{year ? <span>{year}</span> : null}
				</div>
			</div>
			{/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: only stops the click from bubbling to the parent CommandItem's row-select handler; the actual interactive controls are the Button/StatusSelect below */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: not a real interactive element, so no keyboard equivalent is needed */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: same as above — this div is just an event-propagation firewall, not a control */}
			<div
				className="flex shrink-0 items-center gap-1"
				onClick={(e) => e.stopPropagation()}
			>
				<WishlistButton
					isPending={isPending}
					onToggle={() => toggleStatus(game, GAME_STATUSES_ENUM.WISHLIST)}
					trackedStatus={trackedStatus}
				/>
				<StatusSelect
					disabled={isPending}
					onChange={(status) => toggleStatus(game, status)}
					value={trackedStatus}
				/>
			</div>
		</div>
	);
}
