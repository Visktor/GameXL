import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@GameXL/ui/components/select";
import type { GameStatus } from "@/constants/game-status";
import { GAME_STATUS_META, GAME_STATUSES } from "@/constants/game-status";

interface StatusSelectProps {
	disabled?: boolean;
	onChange: (status: GameStatus) => void;
	value: GameStatus | null;
}

export function StatusSelect({ disabled, onChange, value }: StatusSelectProps) {
	return (
		<Select
			disabled={disabled}
			onValueChange={(status) => onChange(status as GameStatus)}
			value={value}
		>
			<SelectTrigger size="sm">
				<SelectValue placeholder="Track">
					{(selected: GameStatus | null) => {
						if (!selected) {
							return "Track";
						}
						const { icon: Icon, label } = GAME_STATUS_META[selected];
						return (
							<>
								<Icon className="h-4 w-4" />
								{label}
							</>
						);
					}}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{GAME_STATUSES.map((status) => {
					const { icon: Icon, label } = GAME_STATUS_META[status];
					return (
						<SelectItem key={status} value={status}>
							<Icon className="h-4 w-4" />
							{label}
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
}
