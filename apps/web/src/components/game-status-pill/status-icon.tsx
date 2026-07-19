import { Button } from "@GameXL/ui/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@GameXL/ui/components/tooltip";
import { cn } from "@GameXL/ui/lib/utils";
import type { GameStatus } from "@/constants/game-status";
import { ENGAGED_STATUSES, GAME_STATUS_META } from "@/constants/game-status";

interface StatusIconProps {
	disabled?: boolean;
	/** Omit for a read-only, non-interactive badge (viewing someone else's list). */
	onRemove?: () => void;
	status: GameStatus;
}

export function StatusIcon({ disabled, onRemove, status }: StatusIconProps) {
	const { icon: Icon, label } = GAME_STATUS_META[status];
	const iconClassName = cn(
		"h-3.5 w-3.5",
		ENGAGED_STATUSES.has(status) ? "text-violet-500" : "text-muted-foreground"
	);

	if (!onRemove) {
		return (
			<span className="flex shrink-0 items-center pl-2" title={label}>
				<Icon className={iconClassName} />
			</span>
		);
	}

	return (
		<div className="flex shrink-0 items-center pl-2">
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							aria-label={`Remove from ${label}`}
							disabled={disabled}
							onClick={onRemove}
							size="icon-xs"
							type="button"
							variant="ghost"
						/>
					}
				>
					<Icon className={iconClassName} />
				</TooltipTrigger>
				<TooltipContent>{label}</TooltipContent>
			</Tooltip>
		</div>
	);
}
