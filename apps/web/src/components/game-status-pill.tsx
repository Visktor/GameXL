import { StarRating } from "@/components/star-rating";
import { StatusQuickAdd } from "@/components/status-quick-add";
import type { GameStatus } from "@/constants/game-status";
import { ENGAGED_STATUSES, GAME_STATUS_META } from "@/constants/game-status";

function StatusIcon({ status }: { status: GameStatus }) {
	const { icon: Icon, label } = GAME_STATUS_META[status];
	return (
		<span
			className={`flex items-center pl-2 ${
				ENGAGED_STATUSES.has(status)
					? "text-violet-500"
					: "text-muted-foreground"
			}`}
			title={label}
		>
			<Icon className="h-3.5 w-3.5" />
		</span>
	);
}

interface GameStatusPillProps {
	isQuickAddPending?: boolean;
	onQuickAddStatus?: (status: GameStatus) => void;
	/** Viewing someone else's list: no quick-add action for untracked games. */
	readOnly?: boolean;
	score: number | null;
	trackedStatus: GameStatus | null;
}

/**
 * Rating + status, laid out as an internal divider rather than its own
 * bordered pill — the outline lives on the card (see GameCard) so this
 * reads as a division inside a boxed card, not a floating isolated badge.
 * The right slot shows the Wishlist quick-add button only while the game
 * is untracked — once it has any status (including WISHLIST) that slot
 * becomes a read-only status icon with a tooltip.
 */
export function GameStatusPill({
	isQuickAddPending,
	onQuickAddStatus,
	readOnly = false,
	score,
	trackedStatus,
}: GameStatusPillProps) {
	const showQuickAdd = !(trackedStatus || readOnly);
	const showRightSlot = Boolean(trackedStatus) || showQuickAdd;

	return (
		<div className="flex items-stretch">
			<div
				className={`flex items-center pr-2 ${score === null ? "opacity-40" : ""}`}
			>
				<StarRating score={score ?? 0} />
			</div>
			{showRightSlot && (
				<>
					<div className="w-px bg-border" />
					{trackedStatus ? (
						<StatusIcon status={trackedStatus} />
					) : (
						<div className="flex items-center pl-2">
							<StatusQuickAdd
								isPending={isQuickAddPending}
								onSelectStatus={(status) => onQuickAddStatus?.(status)}
							/>
						</div>
					)}
				</>
			)}
		</div>
	);
}
