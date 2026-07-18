import { cn } from "@GameXL/ui/lib/utils";
import type { GameStatus } from "@/constants/game-status";
import { ENGAGED_STATUSES, GAME_STATUS_META } from "@/constants/game-status";

export function StatusIcon({ status }: { status: GameStatus }) {
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
