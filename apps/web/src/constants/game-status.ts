import {
	Ban,
	CheckCircle2,
	Gamepad2,
	Heart,
	type LucideIcon,
	PauseCircle,
} from "lucide-react";

export const GAME_STATUSES = [
	"PLAYING",
	"COMPLETED",
	"ON_HOLD",
	"DROPPED",
	"WANT",
] as const;

export type GameStatus = (typeof GAME_STATUSES)[number];

export const GAME_STATUS_META: Record<
	GameStatus,
	{ label: string; icon: LucideIcon }
> = {
	PLAYING: { label: "Playing", icon: Gamepad2 },
	COMPLETED: { label: "Completed", icon: CheckCircle2 },
	ON_HOLD: { label: "On Hold", icon: PauseCircle },
	DROPPED: { label: "Dropped", icon: Ban },
	WANT: { label: "Want to Play", icon: Heart },
};
