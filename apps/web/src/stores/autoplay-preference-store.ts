import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AutoplayPreferenceStore {
	autoplayTrailers: boolean;
	setAutoplayTrailers: (autoplayTrailers: boolean) => void;
}

export const useAutoplayPreferenceStore = create<AutoplayPreferenceStore>()(
	persist(
		(set) => ({
			autoplayTrailers: true,
			setAutoplayTrailers: (autoplayTrailers) => set({ autoplayTrailers }),
		}),
		{ name: "gamexl-autoplay-trailers" }
	)
);
