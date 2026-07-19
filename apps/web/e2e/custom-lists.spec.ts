import { expect, test } from "@playwright/test";
import { mockTrpcProcedure } from "./support/trpc-route";

const SESSION_USER = {
	id: "user-1",
	name: "Test User",
	email: "test@example.com",
	username: "testuser",
	displayUsername: null,
	image: null,
	emailVerified: true,
	createdAt: new Date(0).toISOString(),
	updatedAt: new Date(0).toISOString(),
};

function buildList(overrides: Partial<Record<string, unknown>> = {}) {
	return {
		id: "list-1",
		name: "Best RPGs",
		isPublic: false,
		itemCount: 0,
		createdAt: 0,
		updatedAt: 0,
		...overrides,
	};
}

test("creating a list from My Lists shows it in the grid", async ({ page }) => {
	await page.route("**/api/auth/get-session**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				user: SESSION_USER,
				session: { id: "session-1", userId: SESSION_USER.id },
			}),
		})
	);

	let hasList = false;
	await mockTrpcProcedure(page, "gameList.myLists", () =>
		hasList ? [buildList()] : []
	);

	let createInput: unknown;
	await mockTrpcProcedure(page, "gameList.create", (input) => {
		createInput = input;
		hasList = true;
		return buildList();
	});

	await page.goto("/lists");
	await expect(page.getByText("Nothing here yet.")).toBeVisible();

	await page.getByRole("button", { name: "New list" }).click();
	await page.getByLabel("Name").fill("Best RPGs");
	await page.getByRole("button", { name: "Create" }).click();

	await expect
		.poll(() => createInput)
		.toMatchObject({ name: "Best RPGs", isPublic: false });
	await expect(page.getByText("Best RPGs")).toBeVisible();
});

test("deleting a list removes it from the grid", async ({ page }) => {
	await page.route("**/api/auth/get-session**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				user: SESSION_USER,
				session: { id: "session-1", userId: SESSION_USER.id },
			}),
		})
	);

	let deleted = false;
	await mockTrpcProcedure(page, "gameList.myLists", () =>
		deleted ? [] : [buildList()]
	);

	let removeInput: unknown;
	await mockTrpcProcedure(page, "gameList.remove", (input) => {
		removeInput = input;
		deleted = true;
	});

	await page.goto("/lists");
	await expect(page.getByText("Best RPGs")).toBeVisible();

	await page.getByRole("button", { name: "Best RPGs options" }).click();
	await page.getByRole("menuitem", { name: "Delete" }).click();
	await page.getByRole("button", { name: "Delete", exact: true }).click();

	await expect.poll(() => removeInput).toMatchObject({ listId: "list-1" });
	await expect(page.getByText("Nothing here yet.")).toBeVisible();
});

test("list detail page renders items and removes one from the list", async ({
	page,
}) => {
	await page.route("**/api/auth/get-session**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				user: SESSION_USER,
				session: { id: "session-1", userId: SESSION_USER.id },
			}),
		})
	);

	const items = [
		{
			igdbId: "1",
			title: "Disco Elysium",
			coverUrl: null,
			trailerVideoId: null,
			releaseDate: null,
			igdbScore: 92,
			trackedStatus: null,
		},
		{
			igdbId: "2",
			title: "Hollow Knight",
			coverUrl: null,
			trailerVideoId: null,
			releaseDate: null,
			igdbScore: 88,
			trackedStatus: null,
		},
	];

	await mockTrpcProcedure(page, "gameList.get", () => ({
		...buildList({ itemCount: items.length }),
		isOwner: true,
		items,
	}));

	let removeInput: unknown;
	await mockTrpcProcedure(page, "gameList.removeGame", (input) => {
		removeInput = input;
	});

	await page.goto("/lists/list-1");

	await expect(page.getByText("Disco Elysium").first()).toBeVisible();
	await expect(page.getByText("Hollow Knight").first()).toBeVisible();

	await page.getByRole("button", { name: "Remove from list" }).first().click();

	await expect
		.poll(() => removeInput)
		.toMatchObject({ listId: "list-1", igdbId: "1" });
});

test("sorting a list by title reorders it and disables dragging", async ({
	page,
}) => {
	await page.route("**/api/auth/get-session**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				user: SESSION_USER,
				session: { id: "session-1", userId: SESSION_USER.id },
			}),
		})
	);

	const items = [
		{
			igdbId: "2",
			title: "Hollow Knight",
			coverUrl: null,
			trailerVideoId: null,
			releaseDate: null,
			igdbScore: 88,
			trackedStatus: null,
		},
		{
			igdbId: "1",
			title: "Disco Elysium",
			coverUrl: null,
			trailerVideoId: null,
			releaseDate: null,
			igdbScore: 92,
			trackedStatus: null,
		},
	];

	await mockTrpcProcedure(page, "gameList.get", () => ({
		...buildList({ itemCount: items.length }),
		isOwner: true,
		items,
	}));

	await page.goto("/lists/list-1");

	const titles = page.locator("p.truncate");
	await expect(titles).toHaveText(["Hollow Knight", "Disco Elysium"]);
	await expect(
		page.getByRole("button", { name: "Drag to reorder" })
	).toHaveCount(2);

	await page.getByRole("combobox").click();
	await page.getByRole("option", { name: "Title (A-Z)" }).click();

	await expect(titles).toHaveText(["Disco Elysium", "Hollow Knight"]);
	await expect(
		page.getByRole("button", { name: "Drag to reorder" })
	).toHaveCount(0);
});
