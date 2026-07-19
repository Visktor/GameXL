import { useMutation, useQuery } from "@tanstack/react-query";

import type { GameStatus } from "@/constants/game-status";
import { useTrackedGamesStore } from "@/stores/tracked-games-store";
import { trpcClient } from "@/utils/trpc";

export function useGameDetailQuery(igdbId: string | undefined) {
	const query = useQuery({
		queryKey: ["game", igdbId],
		queryFn: () => trpcClient.game.getById.query({ igdbId: igdbId ?? "" }),
		enabled: Boolean(igdbId),
	});

	const trackedStatus = useTrackedGamesStore((state) =>
		igdbId && igdbId in state.statusByGameId
			? state.statusByGameId[igdbId]
			: (query.data?.trackedStatus ?? null)
	);
	const setTrackedStatus = useTrackedGamesStore((state) => state.setStatus);

	const addMutation = useMutation({
		mutationFn: (trackStatus: GameStatus) => {
			if (!query.data) {
				throw new Error("Cannot track a game before its details have loaded");
			}
			return trpcClient.userGame.add.mutate({
				gameData: {
					igdbId: query.data.igdbId,
					title: query.data.title,
					coverUrl: query.data.coverUrl,
					trailerVideoId: query.data.trailerVideoId,
					releaseDate: query.data.releaseDate,
					igdbScore: query.data.igdbScore,
				},
				status: trackStatus,
			});
		},
		onMutate: (trackStatus) => igdbId && setTrackedStatus(igdbId, trackStatus),
		onError: () =>
			igdbId && setTrackedStatus(igdbId, query.data?.trackedStatus ?? null),
	});

	const removeMutation = useMutation({
		mutationFn: () =>
			trpcClient.userGame.remove.mutate({ igdbId: igdbId ?? "" }),
		onMutate: () => igdbId && setTrackedStatus(igdbId, null),
		onError: () =>
			igdbId && setTrackedStatus(igdbId, query.data?.trackedStatus ?? null),
	});

	return { ...query, trackedStatus, addMutation, removeMutation };
}
