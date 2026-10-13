import { expect, type Page, test } from "@playwright/test";
import { mockTrpcProcedure } from "./support/trpc-route";

const TOTAL_GAMES = 60;
const MOCK_COVER_HOST = "https://mock.local/";
const TRANSPARENT_PNG = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
	"base64"
);
const VIEWPORT_WIDTHS = [1330, 1700, 1830];

function buildGame(index: number) {
	return {
		coverUrl: `${MOCK_COVER_HOST}cover-${index}.png`,
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

async function assertClickedCardStaysCentered(page: Page) {
	await page.route("**/api/auth/get-session**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: "null",
		})
	);
	await page.route(
		(url) => url.href.startsWith(MOCK_COVER_HOST),
		(route) =>
			route.fulfill({
				status: 200,
				contentType: "image/png",
				body: TRANSPARENT_PNG,
			})
	);
	await mockTrpcProcedure(page, "releases.list", () => ({
		games: ALL_GAMES,
		nextOffset: null,
	}));
	await mockTrpcProcedure(
		page,
		"game.getById",
		(input: { igdbId: string }) => ({
			...ALL_GAMES.find((g) => g.igdbId === input.igdbId),
			developer: null,
			genres: [],
			platforms: [],
			summary: null,
			screenshots: [],
			similarGames: [],
		})
	);

	await page.goto("/");

	const renderedCovers = page
		.locator("a[href^='/games/']")
		.filter({ has: page.locator("img") });
	await expect(renderedCovers.first()).toBeVisible();
	const targetHref = await renderedCovers.last().getAttribute("href");
	if (!targetHref) {
		throw new Error("Could not find a rendered card to target");
	}
	const targetCard = page
		.locator(`a[href="${targetHref}"]`)
		.filter({ has: page.locator("img") });

	await targetCard.click();

	await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
	await expect(targetCard).toBeInViewport();

	const cardBox = await targetCard.boundingBox();
	if (!cardBox) {
		throw new Error("Could not measure the selected card after it scrolled");
	}
	const viewportHeight = page.viewportSize()?.height ?? 0;
	const cardCenterY = cardBox.y + cardBox.height / 2;

	expect(cardCenterY).toBeGreaterThan(viewportHeight * 0.25);
	expect(cardCenterY).toBeLessThan(viewportHeight * 0.75);
}

for (const width of VIEWPORT_WIDTHS) {
	test.describe(`at ${width}px viewport`, () => {
		test.use({ viewport: { width, height: 900 } });

		test("keeps the clicked card centered on screen after the preview panel opens and reflows the grid", async ({
			page,
		}) => {
			await assertClickedCardStaysCentered(page);
		});
	});
}
