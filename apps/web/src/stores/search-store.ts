import { create } from "zustand";

interface SearchStore {
	debouncedQuery: string;
	open: boolean;
	query: string;
	reset: () => void;
	setDebouncedQuery: (debouncedQuery: string) => void;
	setOpen: (open: boolean) => void;
	setQuery: (query: string) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
	query: "",
	debouncedQuery: "",
	open: false,
	setQuery: (query) => set({ query }),
	setDebouncedQuery: (debouncedQuery) => set({ debouncedQuery }),
	setOpen: (open) => set({ open }),
	reset: () => set({ query: "", debouncedQuery: "", open: false }),
}));
