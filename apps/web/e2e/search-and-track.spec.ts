import { expect, test } from "@playwright/test";
import { mockTrpcProcedure } from "./support/trpc-route";

const HOLLOW_KNIGHT_NAME = /Hollow Knight/i;
const GAME_DETAILS_URL = /\/games\/1$/;

const HOLLOW_KNIGHT = {
	igdbId: "1",
	title: "Hollow Knight",
	coverUrl: null,
	trailerVideoId: null,
	releaseDate: null,
	igdbScore: 88,
	trackedStatus: null,
};

const HOLLOW_KNIGHT_DETAILS = {
	...HOLLOW_KNIGHT,
	developer: "Team Cherry",
	genres: [],
	platforms: [],
	summary: null,
	screenshots: [],
};

test("search for a game, open its details page, and track it as Playing", async ({
	page,
}) => {
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
	await mockTrpcProcedure(page, "game.getById", () => HOLLOW_KNIGHT_DETAILS);

	let trackedInput: unknown;
	await mockTrpcProcedure(page, "userGame.add", (input) => {
		trackedInput = input;
		return undefined;
	});

	await page.goto("/");

	// Wait for the app to finish mounting before pressing the shortcut — the
	// Cmd+K listener is attached in a useEffect, so a keypress fired before
	// hydration completes is missed with no visible symptom.
	await expect(
		page.getByRole("button", { name: "Toggle theme" })
	).toBeVisible();
	await page.keyboard.press("Control+k");
	await page.getByPlaceholder("Search games...").fill("hollow");
	await page
		.getByRole("option", { name: HOLLOW_KNIGHT_NAME })
		.click({ timeout: 10_000 });

	// Selecting a search result navigates straight to its details page
	// (see 5d477b1 "fix: navigate to game details on search result select").
	await expect(page).toHaveURL(GAME_DETAILS_URL);
	await expect(
		page.getByRole("heading", { name: "Hollow Knight" })
	).toBeVisible();

	const playingButton = page.getByRole("button", { name: "Playing" });
	await playingButton.click();

	await expect
		.poll(() => trackedInput)
		.toMatchObject({
			gameData: { igdbId: "1", title: "Hollow Knight" },
			status: "PLAYING",
		});
});
