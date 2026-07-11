import { expect, test } from "@playwright/test";
import { mockTrpcProcedure } from "./support/trpc-route";

const HOLLOW_KNIGHT_NAME = /Hollow Knight/i;
const SEARCH_RESULTS_URL = /\/search\?q=/;

const HOLLOW_KNIGHT = {
	igdbId: "1",
	title: "Hollow Knight",
	coverUrl: null,
	trailerVideoId: null,
	releaseDate: null,
	igdbScore: 88,
	trackedStatus: null,
};

test("search for a game and track it as Playing", async ({ page }) => {
	await page.route("**/api/auth/get-session**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: "null",
		})
	);
	await mockTrpcProcedure(page, "releases.list", () => ({
		games: [],
		nextOffset: null,
	}));
	await mockTrpcProcedure(page, "search.list", () => ({
		games: [HOLLOW_KNIGHT],
		nextOffset: null,
	}));

	let trackedInput: unknown;
	await mockTrpcProcedure(page, "userGame.add", (input) => {
		trackedInput = input;
		return undefined;
	});

	await page.goto("/");

	await page.getByRole("button", { name: "Search games" }).click();
	await page.getByPlaceholder("Search games...").fill("hollow");
	await page
		.getByRole("option", { name: HOLLOW_KNIGHT_NAME })
		.click({ timeout: 10_000 });

	await expect(page).toHaveURL(SEARCH_RESULTS_URL);
	const gameLink = page.getByRole("link", { name: HOLLOW_KNIGHT_NAME });
	await expect(gameLink).toBeVisible();

	await gameLink.hover();
	const playingButton = page.getByRole("button", { name: "Playing" });
	await playingButton.click();

	await expect(playingButton).toBeDisabled();
	await expect(page.getByRole("button").nth(2)).toBeVisible();
	await expect
		.poll(() => trackedInput)
		.toMatchObject({
			gameData: { igdbId: "1", title: "Hollow Knight" },
			status: "PLAYING",
		});
});
