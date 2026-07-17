import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@GameXL/ui/components/dropdown-menu";
import { ChevronDown } from "lucide-react";

import type { GameStatus } from "@/constants/game-status";
import {
	GAME_STATUS_META,
	GAME_STATUSES,
	GAME_STATUSES_ENUM,
} from "@/constants/game-status";

interface StatusQuickAddProps {
	isPending?: boolean;
	onSelectStatus: (status: GameStatus) => void;
	/**
	 * Whether "Wishlist" appears as a selectable option in the dropdown.
	 * When false (default), Wishlist gets its own dedicated button instead
	 * and is excluded from the dropdown list — the game-card grid/list
	 * usage, where Wishlist is the primary quick-add action.
	 */
	showWishlistOption?: boolean;
}

/**
 * Quick-add controls for an untracked game: jump straight to any status
 * without opening the full hover-preview panel. Reusable wherever a compact
 * "add to a list" control is needed.
 */
export function StatusQuickAdd({
	isPending,
	onSelectStatus,
	showWishlistOption = false,
}: StatusQuickAddProps) {
	const WishlistIcon = GAME_STATUS_META.WISHLIST.icon;
	const dropdownStatuses = showWishlistOption
		? GAME_STATUSES
		: GAME_STATUSES.filter((status) => status !== GAME_STATUSES_ENUM.WISHLIST);

	return (
		<div className="flex items-center">
			{!showWishlistOption && (
				<button
					aria-label="Add to wishlist"
					className="flex items-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
					disabled={isPending}
					onClick={(e) => {
						e.preventDefault();
						onSelectStatus(GAME_STATUSES_ENUM.WISHLIST);
					}}
					type="button"
				>
					<WishlistIcon className="h-3.5 w-3.5" />
				</button>
			)}
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<button
							aria-label="Add to another list"
							className={`flex items-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50 ${
								showWishlistOption ? "" : "pl-1"
							}`}
							disabled={isPending}
							onClick={(e) => e.preventDefault()}
							type="button"
						/>
					}
				>
					<ChevronDown className="h-3 w-3" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="min-w-32">
					{dropdownStatuses.map((status) => {
						const { icon: Icon, label } = GAME_STATUS_META[status];
						return (
							<DropdownMenuItem
								key={status}
								onClick={(e) => {
									e.preventDefault();
									onSelectStatus(status);
								}}
							>
								<Icon className="h-3.5 w-3.5" />
								{label}
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
