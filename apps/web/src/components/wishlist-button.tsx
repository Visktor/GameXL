import { Button } from "@GameXL/ui/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@GameXL/ui/components/tooltip";
import { cn } from "@GameXL/ui/lib/utils";
import type { GameStatus } from "@/constants/game-status";
import { GAME_STATUS_META, GAME_STATUSES_ENUM } from "@/constants/game-status";

interface WishlistButtonProps {
	isPending?: boolean;
	onToggle?: () => void;
	/** Viewing someone else's list: show status only, no interaction. */
	readOnly?: boolean;
	trackedStatus: GameStatus | null;
}

export function WishlistButton({
	isPending,
	onToggle,
	readOnly = false,
	trackedStatus,
}: WishlistButtonProps) {
	const isWishlisted = trackedStatus === GAME_STATUSES_ENUM.WISHLIST;
	const GiftIcon = GAME_STATUS_META.WISHLIST.icon;
	const label = isWishlisted ? "Wishlisted" : "Wishlist";

	const iconClassName = cn(
		"h-4 w-4",
		isWishlisted ? "text-violet-500" : "text-muted-foreground"
	);

	if (readOnly) {
		return (
			<GiftIcon
				aria-label={isWishlisted ? "On wishlist" : "Not on wishlist"}
				className={iconClassName}
			/>
		);
	}

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						aria-label={label}
						aria-pressed={isWishlisted}
						disabled={isPending}
						onClick={(e) => {
							e.preventDefault();
							onToggle?.();
						}}
						size="icon-xs"
						type="button"
						variant="ghost"
					/>
				}
			>
				<GiftIcon className={iconClassName} />
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}
