import { describe, expect, it } from "vitest";
import { buildPage, DEFAULT_PAGE_SIZE } from "@/utils/pagination";

describe("buildPage", () => {
	it("returns the next offset when the page is full", () => {
		const items = Array.from({ length: DEFAULT_PAGE_SIZE }, (_, i) => i);

		const page = buildPage(items, DEFAULT_PAGE_SIZE, 0);

		expect(page.nextOffset).toBe(DEFAULT_PAGE_SIZE);
	});

	it("returns null next offset when the page is partial", () => {
		const items = [1, 2, 3];

		const page = buildPage(items, DEFAULT_PAGE_SIZE, 0);

		expect(page.nextOffset).toBeNull();
	});
});
