import { GAME_STATUS_META, type GameStatus } from "@/constants/game-status";

export function GameStatusIconLabel({ status }: { status: GameStatus }) {
	const { icon: Icon, label } = GAME_STATUS_META[status];
	return (
		<>
			<Icon className="h-4 w-4" />
			{label}
		</>
	);
}
