import {
	Ban,
	CheckCircle2,
	Gamepad2,
	Gift,
	type LucideIcon,
	PauseCircle,
} from "lucide-react";

export const GAME_STATUSES_ENUM = {
	WISHLIST: "WISHLIST",
	PLAYING: "PLAYING",
	COMPLETED: "COMPLETED",
	ON_HOLD: "ON_HOLD",
	DROPPED: "DROPPED",
} as const;

export const GAME_STATUSES = Object.values(GAME_STATUSES_ENUM);

export type GameStatus = (typeof GAME_STATUSES)[number];

export const GAME_STATUS_META: Record<
	GameStatus,
	{ label: string; icon: LucideIcon }
> = {
	PLAYING: { label: "Playing", icon: Gamepad2 },
	COMPLETED: { label: "Completed", icon: CheckCircle2 },
	ON_HOLD: { label: "On Hold", icon: PauseCircle },
	DROPPED: { label: "Dropped", icon: Ban },
	WISHLIST: { label: "Wishlist", icon: Gift },
};

/** Statuses reachable via the track button-group; Wishlist has its own dedicated control. */
export const TRACK_STATUSES = GAME_STATUSES.filter(
	(status) => status !== GAME_STATUSES_ENUM.WISHLIST
);

/** Statuses that read as "actively engaged with" for status-icon styling. */
export const ENGAGED_STATUSES = new Set<GameStatus>([
	GAME_STATUSES_ENUM.PLAYING,
	GAME_STATUSES_ENUM.COMPLETED,
	GAME_STATUSES_ENUM.WISHLIST,
]);
