import { cn } from "@GameXL/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";
import { StarRating } from "@/components/star-rating";
import { StatusQuickAdd } from "@/components/status-quick-add";
import type { GameStatus } from "@/constants/game-status";
import { ENGAGED_STATUSES, GAME_STATUS_META } from "@/constants/game-status";

function Rating({ score }: { score: number | null }) {
	return (
		<div
			className={cn("flex items-center pr-2", score === null && "opacity-40")}
		>
			<StarRating score={score ?? 0} />
		</div>
	);
}

function Divider() {
	return <div className="w-px bg-border" />;
}

function StatusIcon({ status }: { status: GameStatus }) {
	const { icon: Icon, label } = GAME_STATUS_META[status];
	return (
		<span
			className={cn(
				"flex items-center pl-2",
				ENGAGED_STATUSES.has(status)
					? "text-violet-500"
					: "text-muted-foreground"
			)}
			title={label}
		>
			<Icon className="h-3.5 w-3.5" />
		</span>
	);
}

function QuickAdd(props: ComponentProps<typeof StatusQuickAdd>) {
	return (
		<div className="flex items-center pl-2">
			<StatusQuickAdd {...props} />
		</div>
	);
}

/**
 * Rating + status, laid out as an internal divider rather than its own
 * bordered pill — the outline lives on the card (see GameCard) so this
 * reads as a division inside a boxed card, not a floating isolated badge.
 * Purely layout: compose with GameStatusPill.Rating / .Divider / .StatusIcon
 * / .QuickAdd — the caller decides what (if anything) goes in the right slot.
 */
export function GameStatusPill({ children }: { children: ReactNode }) {
	return <div className="flex items-stretch">{children}</div>;
}

GameStatusPill.Rating = Rating;
GameStatusPill.Divider = Divider;
GameStatusPill.StatusIcon = StatusIcon;
GameStatusPill.QuickAdd = QuickAdd;
