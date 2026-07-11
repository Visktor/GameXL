import type { TrackedGameEntry } from "@GameXL/api/services/user-game.service";
import type { ReleaseGame } from "@/components/game-card";

export function toReleaseGame(entry: TrackedGameEntry): ReleaseGame {
	return {
		igdbId: entry.igdbId,
		title: entry.title,
		coverUrl: entry.coverUrl,
		trailerVideoId: entry.trailerVideoId,
		releaseDate: entry.releaseDate,
		igdbScore: entry.igdbScore,
		trackedStatus: entry.status,
		updatedAt: entry.updatedAt,
	};
}
