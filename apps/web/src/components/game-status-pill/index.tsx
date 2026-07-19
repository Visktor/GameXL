import type { ReactNode } from "react";
import { Divider } from "./divider";
import { QuickAdd } from "./quick-add";
import { Rating } from "./rating";
import { StatusIcon } from "./status-icon";

/**
 * Rating + status, laid out as an internal divider rather than its own
 * bordered pill — the outline lives on the card (see GameCard) so this
 * reads as a division inside a boxed card, not a floating isolated badge.
 * Purely layout: compose with GameStatusPill.Rating / .Divider / .StatusIcon
 * / .QuickAdd — the caller decides what (if anything) goes in the right slot.
 */
export function GameStatusPill({ children }: { children: ReactNode }) {
	return <div className="flex min-w-0 items-stretch">{children}</div>;
}

GameStatusPill.Rating = Rating;
GameStatusPill.Divider = Divider;
GameStatusPill.StatusIcon = StatusIcon;
GameStatusPill.QuickAdd = QuickAdd;
