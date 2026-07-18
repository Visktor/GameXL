import { expect, type Page, test } from "@playwright/test";
import { mockTrpcProcedure } from "./support/trpc-route";

const HOLLOW_KNIGHT_NAME = /Hollow Knight/i;

const HOLLOW_KNIGHT = {
	igdbId: "1",
	title: "Hollow Knight",
	coverUrl: null,
	trailerVideoId: null,
	releaseDate: null,
	igdbScore: 88,
	trackedStatus: null as string | null,
};

async function openSearchWith(page: Page, game: typeof HOLLOW_KNIGHT) {
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
		games: [game],
		nextOffset: null,
	}));

	await page.goto("/");
	// Wait for the app to finish mounting before pressing the shortcut — the
	// Cmd+K listener is attached in a useEffect, so a keypress fired before
	// hydration completes is missed with no visible symptom.
	await expect(
		page.getByRole("button", { name: "Toggle theme" })
	).toBeVisible();
	await page.keyboard.press("Control+k");
	await page.getByPlaceholder("Search games...").fill("hollow");
	await expect(
		page.getByRole("option", { name: HOLLOW_KNIGHT_NAME })
	).toBeVisible();
}

test("clicking the wishlist button on a search result quick-adds it", async ({
	page,
}) => {
	await openSearchWith(page, HOLLOW_KNIGHT);

	let trackedInput: unknown;
	await mockTrpcProcedure(page, "userGame.add", (input) => {
		trackedInput = input;
		return undefined;
	});

	const row = page.getByRole("option", { name: HOLLOW_KNIGHT_NAME });
	await row.getByRole("button", { name: "Add to wishlist" }).click();

	await expect
		.poll(() => trackedInput)
		.toMatchObject({
			gameData: { igdbId: "1", title: "Hollow Knight" },
			status: "WISHLIST",
		});
	await expect(
		row.getByRole("button", { name: "Remove from wishlist" })
	).toBeVisible();
});

test("clicking the wishlist button again removes it", async ({ page }) => {
	await openSearchWith(page, { ...HOLLOW_KNIGHT, trackedStatus: "WISHLIST" });

	let removeCalled = false;
	await mockTrpcProcedure(page, "userGame.remove", () => {
		removeCalled = true;
		return undefined;
	});

	const row = page.getByRole("option", { name: HOLLOW_KNIGHT_NAME });
	await row.getByRole("button", { name: "Remove from wishlist" }).click();

	await expect.poll(() => removeCalled).toBe(true);
	await expect(
		row.getByRole("button", { name: "Add to wishlist" })
	).toBeVisible();
});

test("Cmd+Enter quick-adds the highlighted result to the wishlist", async ({
	page,
}) => {
	await openSearchWith(page, HOLLOW_KNIGHT);

	let trackedInput: unknown;
	await mockTrpcProcedure(page, "userGame.add", (input) => {
		trackedInput = input;
		return undefined;
	});

	await page.getByPlaceholder("Search games...").press("Control+Enter");

	await expect
		.poll(() => trackedInput)
		.toMatchObject({
			gameData: { igdbId: "1", title: "Hollow Knight" },
			status: "WISHLIST",
		});
});

test("Cmd+Enter on an already-wishlisted result removes it instead", async ({
	page,
}) => {
	await openSearchWith(page, { ...HOLLOW_KNIGHT, trackedStatus: "WISHLIST" });

	let removeReceived: unknown;
	await mockTrpcProcedure(page, "userGame.remove", (input) => {
		removeReceived = input;
		return undefined;
	});

	await page.getByPlaceholder("Search games...").press("Control+Enter");

	await expect.poll(() => removeReceived).toMatchObject({ igdbId: "1" });
});

test("Alt+ArrowRight cycles the highlighted result forward through statuses", async ({
	page,
}) => {
	await openSearchWith(page, HOLLOW_KNIGHT);

	const receivedStatuses: string[] = [];
	await mockTrpcProcedure(page, "userGame.add", (input) => {
		receivedStatuses.push((input as { status: string }).status);
		return undefined;
	});

	const input = page.getByPlaceholder("Search games...");
	await input.press("Alt+ArrowRight");
	await expect.poll(() => receivedStatuses).toEqual(["WISHLIST"]);

	await input.press("Alt+ArrowRight");
	await expect.poll(() => receivedStatuses).toEqual(["WISHLIST", "PLAYING"]);
});

test("Alt+ArrowLeft cycles the highlighted result backward, wrapping to the last status", async ({
	page,
}) => {
	await openSearchWith(page, HOLLOW_KNIGHT);

	let trackedInput: unknown;
	await mockTrpcProcedure(page, "userGame.add", (input) => {
		trackedInput = input;
		return undefined;
	});

	await page.getByPlaceholder("Search games...").press("Alt+ArrowLeft");

	await expect.poll(() => trackedInput).toMatchObject({ status: "DROPPED" });
});
