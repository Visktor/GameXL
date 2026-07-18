import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ReleaseGame } from "@/components/game-card";
import { GAME_STATUS_META, type GameStatus } from "@/constants/game-status";
import { useTrackedGamesStore } from "@/stores/tracked-games-store";
import { trpcClient } from "@/utils/trpc";

interface AddVariables {
	game: ReleaseGame;
	status: GameStatus;
}

interface RemoveVariables {
	game: ReleaseGame;
}

interface MutationContext {
	previousStatus: GameStatus | null;
}

/**
 * Resolves a game's effective status from the optimistic-override store,
 * falling back to the server-provided status only when the store has no
 * entry at all. A plain `storedStatus ?? game.trackedStatus` is wrong here:
 * once a game is removed, the store holds an explicit `null`, and `??`
 * can't tell that apart from "never overridden" — it would fall back to
 * the stale server-provided status and make the removal look like a no-op.
 */
export function resolveTrackedStatus(
	game: ReleaseGame,
	statusByGameId: Record<string, GameStatus | null>
): GameStatus | null {
	return game.igdbId in statusByGameId
		? statusByGameId[game.igdbId]
		: game.trackedStatus;
}

export function useTrackGameMutation() {
	const setTrackedStatus = useTrackedGamesStore((state) => state.setStatus);

	const addMutation = useMutation({
		mutationFn: ({ game, status }: AddVariables) =>
			trpcClient.userGame.add.mutate({
				gameData: {
					igdbId: game.igdbId,
					title: game.title,
					coverUrl: game.coverUrl,
					trailerVideoId: game.trailerVideoId,
					releaseDate: game.releaseDate,
					igdbScore: game.igdbScore,
				},
				status,
			}),
		onMutate: ({ game, status }): MutationContext => {
			const previousStatus = resolveTrackedStatus(
				game,
				useTrackedGamesStore.getState().statusByGameId
			);
			setTrackedStatus(game.igdbId, status);
			return { previousStatus };
		},
		onError: (_error, { game }, context) => {
			setTrackedStatus(
				game.igdbId,
				context ? context.previousStatus : game.trackedStatus
			);
		},
	});

	const removeMutation = useMutation({
		mutationFn: ({ game }: RemoveVariables) =>
			trpcClient.userGame.remove.mutate({ igdbId: game.igdbId }),
		onMutate: ({ game }): MutationContext => {
			const previousStatus = resolveTrackedStatus(
				game,
				useTrackedGamesStore.getState().statusByGameId
			);
			setTrackedStatus(game.igdbId, null);
			return { previousStatus };
		},
		onError: (_error, { game }, context) => {
			setTrackedStatus(
				game.igdbId,
				context ? context.previousStatus : game.trackedStatus
			);
		},
	});

	/** Quick-add from search: sets the status and shows an undo toast that restores whatever status the game had before. */
	function quickAdd(game: ReleaseGame, status: GameStatus) {
		addMutation.mutate(
			{ game, status },
			{
				onSuccess: (_data, _variables, context) => {
					const previousStatus = context?.previousStatus ?? null;
					const { label } = GAME_STATUS_META[status];
					toast.success(`Added to ${label}`, {
						action: {
							label: "Undo",
							onClick: () => {
								if (previousStatus) {
									addMutation.mutate({ game, status: previousStatus });
								} else {
									removeMutation.mutate({ game });
								}
							},
						},
					});
				},
			}
		);
	}

	/** Quick-add from search, but pressing the same status again removes the game instead of re-adding it. */
	function toggleStatus(game: ReleaseGame, status: GameStatus) {
		const currentStatus = resolveTrackedStatus(
			game,
			useTrackedGamesStore.getState().statusByGameId
		);
		if (currentStatus === status) {
			removeMutation.mutate({ game });
		} else {
			quickAdd(game, status);
		}
	}

	return { addMutation, removeMutation, quickAdd, toggleStatus };
}
