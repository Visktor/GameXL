import { GameStatusPill } from "@/components/game-status-pill";
import type { GameStatus } from "@/constants/game-status";

export function GameCardStatusRow({
	isQuickAddPending,
	onQuickAddStatus,
	readOnly,
	score,
	trackedStatus,
}: {
	isQuickAddPending: boolean;
	onQuickAddStatus: (status: GameStatus) => void;
	readOnly: boolean;
	score: number | null;
	trackedStatus: GameStatus | null;
}) {
	return (
		<GameStatusPill>
			<GameStatusPill.Rating score={score} />
			{trackedStatus ? (
				<>
					<GameStatusPill.Divider />
					<GameStatusPill.StatusIcon status={trackedStatus} />
				</>
			) : (
				!readOnly && (
					<>
						<GameStatusPill.Divider />
						<GameStatusPill.QuickAdd
							isPending={isQuickAddPending}
							onSelectStatus={onQuickAddStatus}
						/>
					</>
				)
			)}
		</GameStatusPill>
	);
}
