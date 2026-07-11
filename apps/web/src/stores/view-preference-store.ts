import { create } from "zustand";

type Layout = "grid" | "list";

interface ViewPreferenceStore {
	layout: Layout;
	setLayout: (layout: Layout) => void;
}

export const useViewPreferenceStore = create<ViewPreferenceStore>((set) => ({
	layout: "grid",
	setLayout: (layout) => set({ layout }),
}));
