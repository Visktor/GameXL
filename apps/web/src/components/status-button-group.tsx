import { Button } from "@GameXL/ui/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@GameXL/ui/components/tooltip";
import type { GameStatus } from "@/constants/game-status";
import { GAME_STATUS_META, GAME_STATUSES } from "@/constants/game-status";

interface StatusButtonGroupProps {
	disabled?: boolean;
	/** Called with the clicked status, or `null` when the clicked status was
	 * already selected — a re-click toggles the game out of that status. */
	onChange: (status: GameStatus | null) => void;
	statuses?: readonly GameStatus[];
	value: GameStatus | null;
}

export function StatusButtonGroup({
	disabled,
	onChange,
	statuses = GAME_STATUSES,
	value,
}: StatusButtonGroupProps) {
	return (
		<fieldset
			aria-label="Track status"
			className="flex flex-wrap gap-1 border-0 p-0"
		>
			{statuses.map((status) => {
				const { icon: Icon, label } = GAME_STATUS_META[status];
				const selected = value === status;
				return (
					<Tooltip key={status}>
						<TooltipTrigger
							render={
								<Button
									aria-label={label}
									aria-pressed={selected}
									disabled={disabled}
									onClick={() => onChange(selected ? null : status)}
									size="icon-xs"
									type="button"
									variant={selected ? "default" : "outline"}
								/>
							}
						>
							<Icon className="h-3 w-3" />
						</TooltipTrigger>
						<TooltipContent>{label}</TooltipContent>
					</Tooltip>
				);
			})}
		</fieldset>
	);
}
