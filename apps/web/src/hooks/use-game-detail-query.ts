import { useQuery } from "@tanstack/react-query";

import {
	resolveTrackedStatus,
	useTrackGameMutation,
} from "@/hooks/use-track-game-mutation";
import { useTrackedGamesStore } from "@/stores/tracked-games-store";
import { trpcClient } from "@/utils/trpc";

export function useGameDetailQuery(igdbId: string | undefined) {
	const query = useQuery({
		queryKey: ["game", igdbId],
		queryFn: () => trpcClient.game.getById.query({ igdbId: igdbId ?? "" }),
		enabled: Boolean(igdbId),
	});

	const trackedStatus = useTrackedGamesStore((state) =>
		query.data ? resolveTrackedStatus(query.data, state.statusByGameId) : null
	);

	const { addMutation, removeMutation } = useTrackGameMutation();

	return { ...query, trackedStatus, addMutation, removeMutation };
}
