import type { Context } from "../context";
import type { GameStatus } from "../schemas/user-game.schema";

export interface GameListSummary {
	createdAt: number;
	id: string;
	isPublic: boolean;
	itemCount: number;
	name: string;
	updatedAt: number;
}

export interface GameListItemEntry {
	coverUrl: string | null;
	igdbId: string;
	igdbScore: number | null;
	releaseDate: number | null;
	title: string;
	trackedStatus: GameStatus | null;
	trailerVideoId: string | null;
}

export interface GameListDetail extends GameListSummary {
	isOwner: boolean;
	items: GameListItemEntry[];
}

export interface AuthedContext {
	logger: Context["logger"];
	session: NonNullable<Context["session"]>;
}
