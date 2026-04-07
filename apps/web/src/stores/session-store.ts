import { Thumbmark } from "@thumbmarkjs/thumbmarkjs";
import { create } from "zustand";

interface SessionStore {
	fingerprint: string | null;
	initFingerprint: () => Promise<void>;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
	fingerprint: null,

	initFingerprint: async () => {
		if (get().fingerprint) {
			return;
		}
		const result = await new Thumbmark().get();
		set({ fingerprint: result.thumbmark });
	},
}));
