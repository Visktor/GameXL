import { GameStatusPill } from "@/components/game-status-pill";
import { StatusButtonGroup } from "@/components/status-button-group";
import type { GameStatus } from "@/constants/game-status";

export function GameCardStatusRow({
	isList,
	isQuickAddPending,
	isRemovePending,
	onQuickAddStatus,
	onRemoveStatus,
	readOnly,
	score,
	trackedStatus,
}: {
	isList: boolean;
	isQuickAddPending: boolean;
	isRemovePending: boolean;
	onQuickAddStatus: (status: GameStatus) => void;
	onRemoveStatus: () => void;
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
					<GameStatusPill.StatusIcon
						disabled={isRemovePending}
						onRemove={readOnly ? undefined : onRemoveStatus}
						status={trackedStatus}
					/>
				</>
			) : (
				!readOnly && (
					<>
						<GameStatusPill.Divider />
						{isList ? (
							<div className="flex shrink-0 items-center pl-2">
								<StatusButtonGroup
									disabled={isQuickAddPending}
									onChange={(status) => status && onQuickAddStatus(status)}
									value={null}
								/>
							</div>
						) : (
							<GameStatusPill.QuickAdd
								isPending={isQuickAddPending}
								onSelectStatus={onQuickAddStatus}
							/>
						)}
					</>
				)
			)}
		</GameStatusPill>
	);
}
