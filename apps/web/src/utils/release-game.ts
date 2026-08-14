import type { GameListItemEntry } from "@GameXL/api/services/game-list.service";
import type { TrackedGameEntry } from "@GameXL/api/services/user-game.service";
import type { ReleaseGame } from "@/components/game-card";

export function toReleaseGame(
	entry: GameListItemEntry | TrackedGameEntry
): ReleaseGame {
	return { ...entry };
}
