import { Button } from "@GameXL/ui/components/button";
import { cn } from "@GameXL/ui/lib/utils";
import type { GameStatus } from "@/constants/game-status";
import { GAME_STATUS_META, GAME_STATUSES_ENUM } from "@/constants/game-status";

interface WishlistButtonProps {
	isPending?: boolean;
	onToggle?: () => void;
	/** Viewing someone else's list: show status only, no interaction. */
	readOnly?: boolean;
	trackedStatus: GameStatus | null;
	/** "compact" for tight spaces (grid card, hover-preview), "full" for a CTA with a label. */
	variant?: "compact" | "full";
}

export function WishlistButton({
	isPending,
	onToggle,
	readOnly = false,
	trackedStatus,
	variant = "compact",
}: WishlistButtonProps) {
	const isWishlisted = trackedStatus === GAME_STATUSES_ENUM.WISHLIST;
	const isCompact = variant === "compact";
	const GiftIcon = GAME_STATUS_META.WISHLIST.icon;

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
		<Button
			aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
			aria-pressed={isWishlisted}
			disabled={isPending}
			onClick={(e) => {
				e.preventDefault();
				onToggle?.();
			}}
			size={isCompact ? "icon-xs" : "sm"}
			type="button"
			variant="ghost"
		>
			<GiftIcon className={iconClassName} />
			{!isCompact && (isWishlisted ? "Wishlisted" : "Wishlist")}
		</Button>
	);
}
