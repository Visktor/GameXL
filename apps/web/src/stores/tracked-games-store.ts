import { create } from "zustand";
import type { GameStatus } from "@/constants/game-status";

type TrackedStatus = GameStatus | null;

interface TrackedGamesStore {
	setStatus: (igdbId: string, status: TrackedStatus) => void;
	statusByGameId: Record<string, TrackedStatus>;
}

export const useTrackedGamesStore = create<TrackedGamesStore>((set) => ({
	statusByGameId: {},
	setStatus: (igdbId, status) =>
		set((state) => ({
			statusByGameId: { ...state.statusByGameId, [igdbId]: status },
		})),
}));
