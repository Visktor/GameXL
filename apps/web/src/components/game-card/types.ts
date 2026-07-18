import type { GameStatus } from "@/constants/game-status";

export interface ReleaseGame {
	coverUrl: string | null;
	igdbId: string;
	igdbScore: number | null;
	releaseDate: number | null;
	title: string;
	trackedStatus: GameStatus | null;
	trailerVideoId: string | null;
	/** Epoch ms this game's tracked status was last updated. Only set on list pages. */
	updatedAt?: number;
}
