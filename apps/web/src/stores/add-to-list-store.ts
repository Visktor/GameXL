import { create } from "zustand";

interface AddToListStore {
	addedListIdsByGame: Record<string, string[]>;
	markAdded: (igdbId: string, listId: string) => void;
}

export const useAddToListStore = create<AddToListStore>((set) => ({
	addedListIdsByGame: {},
	markAdded: (igdbId, listId) =>
		set((state) => ({
			addedListIdsByGame: {
				...state.addedListIdsByGame,
				[igdbId]: [...(state.addedListIdsByGame[igdbId] ?? []), listId],
			},
		})),
}));
