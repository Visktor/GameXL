import { expect, type Page, test } from "@playwright/test";
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

function mockSession(page: Page) {
	return page.route("**/api/auth/get-session**", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				user: SESSION_USER,
				session: { id: "session-1", userId: SESSION_USER.id },
			}),
		})
	);
}

test("creating a list from My Lists shows it in the grid", async ({ page }) => {
	await mockSession(page);

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

	await page.getByRole("link", { name: "New list" }).click();
	await page.getByLabel("Name").fill("Best RPGs");
	await page.getByRole("button", { name: "Create" }).click();

	await expect
		.poll(() => createInput)
		.toMatchObject({ name: "Best RPGs", isPublic: false });
	await expect(page.getByText("Best RPGs")).toBeVisible();
});

test("deleting a list removes it from the grid", async ({ page }) => {
	await mockSession(page);

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

test("renaming a list via its deep link fetches and pre-fills the form", async ({
	page,
}) => {
	await mockSession(page);

	await mockTrpcProcedure(page, "gameList.get", () => ({
		...buildList(),
		isOwner: true,
		items: [],
	}));

	let updateInput: unknown;
	await mockTrpcProcedure(page, "gameList.update", (input) => {
		updateInput = input;
		return { ...buildList(), name: "Best RPGs Ever" };
	});

	await page.goto("/lists/list-1/edit");

	await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
		"Best RPGs"
	);

	await page.getByLabel("Name", { exact: true }).fill("Best RPGs Ever");
	await page.getByRole("button", { name: "Save" }).click();

	await expect
		.poll(() => updateInput)
		.toMatchObject({ listId: "list-1", name: "Best RPGs Ever" });
	await expect(page).toHaveURL("/lists/list-1");
});

test("list detail page renders items and removes one from the list", async ({
	page,
}) => {
	await mockSession(page);

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

test("sorting a list reorders it, persists the new order, and keeps dragging enabled", async ({
	page,
}) => {
	await mockSession(page);

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

	let reorderInput: unknown;
	await mockTrpcProcedure(page, "gameList.reorder", (input) => {
		reorderInput = input;
	});

	await page.goto("/lists/list-1");

	const titles = page.locator("p.truncate");
	await expect(titles).toHaveText(["Hollow Knight", "Disco Elysium"]);
	await expect(
		page.getByRole("button", { name: "Drag to reorder" })
	).toHaveCount(2);

	await page.getByRole("button", { name: "Sort" }).click();
	await page.getByRole("menuitem", { name: "Title (A-Z)" }).click();

	await expect(titles).toHaveText(["Disco Elysium", "Hollow Knight"]);
	await expect
		.poll(() => reorderInput)
		.toMatchObject({ listId: "list-1", orderedIgdbIds: ["1", "2"] });

	await expect(
		page.getByRole("button", { name: "Drag to reorder" })
	).toHaveCount(2);
});
