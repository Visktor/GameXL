import { expect, test } from "@playwright/test";
import { mockTrpcProcedure } from "./support/trpc-route";

const PAGE_SIZE = 20;
const TOTAL_GAMES = 60;
const TRANSPARENT_PNG = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
	"base64"
);

function buildGame(index: number) {
	return {
		coverUrl: `https://mock.local/cover-${index}.png`,
		igdbId: String(index),
		igdbScore: 80,
		releaseDate: null,
		title: `Mock Game ${index}`,
		trackedStatus: null,
		trailerVideoId: null,
	};
}

const ALL_GAMES = Array.from({ length: TOTAL_GAMES }, (_, i) =>
	buildGame(i + 1)
);

test("prefetches upcoming release pages ahead of scroll", async ({ page }) => {
	await page.route("**/api/auth/get-session**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: "null",
		})
	);
	await page.route("https://mock.local/**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "image/png",
			body: TRANSPARENT_PNG,
		})
	);

	const requestedOffsets: number[] = [];
	await mockTrpcProcedure(
		page,
		"releases.list",
		(input: { offset: number }) => {
			const { offset } = input;
			requestedOffsets.push(offset);
			const games = ALL_GAMES.slice(offset, offset + PAGE_SIZE);
			const nextOffset =
				offset + PAGE_SIZE < TOTAL_GAMES ? offset + PAGE_SIZE : null;
			return { games, nextOffset };
		}
	);

	await page.goto("/");

	const firstCard = page.locator("a[href^='/games/']").first();
	await expect(firstCard).toBeVisible();
	await expect(firstCard.locator("img")).toHaveAttribute(
		"fetchpriority",
		"high"
	);

	// A small scroll -- nowhere near the true bottom of the first page --
	// should already trigger the next-page prefetch via rangeChanged, well
	// before the user reaches the last rendered card (unlike endReached,
	// which only fires once the last item nears the viewport).
	await page.mouse.wheel(0, 400);
	await expect.poll(() => requestedOffsets).toContain(PAGE_SIZE);

	// Cards preloaded ahead of scroll are deprioritized so they don't
	// compete with what the user is actually looking at.
	await expect
		.poll(() =>
			page.locator("a[href^='/games/'] img[fetchpriority='low']").count()
		)
		.toBeGreaterThan(0);
});
