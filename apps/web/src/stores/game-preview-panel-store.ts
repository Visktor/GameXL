import { create } from "zustand";

interface GamePreviewPanelStore {
	close: () => void;
	open: (igdbId: string) => void;
	selectedGameId: string | null;
}

export const useGamePreviewPanelStore = create<GamePreviewPanelStore>(
	(set) => ({
		selectedGameId: null,
		open: (igdbId) => set({ selectedGameId: igdbId }),
		close: () => set({ selectedGameId: null }),
	})
);
