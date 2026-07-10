import { beforeEach, describe, expect, it } from "vitest";
import { useSearchStore } from "@/stores/search-store";

beforeEach(() => {
	useSearchStore.getState().reset();
});

describe("useSearchStore", () => {
	it("starts with an empty, closed state", () => {
		const state = useSearchStore.getState();

		expect(state).toMatchObject({
			query: "",
			debouncedQuery: "",
			open: false,
		});
	});

	it("updates query and debouncedQuery independently", () => {
		useSearchStore.getState().setQuery("hollow");
		useSearchStore.getState().setDebouncedQuery("hollow knight");

		const state = useSearchStore.getState();

		expect(state.query).toBe("hollow");
		expect(state.debouncedQuery).toBe("hollow knight");
	});

	it("toggles open state", () => {
		useSearchStore.getState().setOpen(true);

		expect(useSearchStore.getState().open).toBe(true);
	});

	it("resets query, debouncedQuery, and open together", () => {
		useSearchStore.getState().setQuery("celeste");
		useSearchStore.getState().setDebouncedQuery("celeste");
		useSearchStore.getState().setOpen(true);

		useSearchStore.getState().reset();

		expect(useSearchStore.getState()).toMatchObject({
			query: "",
			debouncedQuery: "",
			open: false,
		});
	});
});
