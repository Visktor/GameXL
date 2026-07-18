import { Button } from "@GameXL/ui/components/button";
import type { GameStatus } from "@/constants/game-status";
import { GAME_STATUS_META, GAME_STATUSES } from "@/constants/game-status";

interface StatusButtonGroupProps {
	disabled?: boolean;
	onChange: (status: GameStatus) => void;
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
					<Button
						aria-pressed={selected}
						disabled={disabled}
						key={status}
						onClick={() => onChange(status)}
						size="xs"
						type="button"
						variant={selected ? "default" : "outline"}
					>
						<Icon className="h-3 w-3" />
						{label}
					</Button>
				);
			})}
		</fieldset>
	);
}
