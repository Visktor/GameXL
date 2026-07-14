import { Button } from "@GameXL/ui/components/button";
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

export function StatusButtonGroup({
	disabled,
	onChange,
	statuses = GAME_STATUSES,
	value,
}: StatusSelectProps & { statuses?: readonly GameStatus[] }) {
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
