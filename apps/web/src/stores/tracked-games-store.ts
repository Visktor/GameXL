import { create } from "zustand";

type TrackedStatus = string | null;

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
