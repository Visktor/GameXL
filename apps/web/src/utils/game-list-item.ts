import type { GameListItemEntry } from "@GameXL/api/services/game-list.service";
import type { ReleaseGame } from "@/components/game-card";

export function listItemToReleaseGame(entry: GameListItemEntry): ReleaseGame {
	return {
		igdbId: entry.igdbId,
		title: entry.title,
		coverUrl: entry.coverUrl,
		trailerVideoId: entry.trailerVideoId,
		releaseDate: entry.releaseDate,
		igdbScore: entry.igdbScore,
		trackedStatus: entry.trackedStatus,
	};
}
