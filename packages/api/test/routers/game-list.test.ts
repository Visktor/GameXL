import db from "@GameXL/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "@/routers/index";
import { createTestContext } from "../support/context";

vi.mock("@GameXL/db", () => ({
	createPrismaClient: vi.fn(),
	default: {
		gameList: {
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			findMany: vi.fn(),
			findUnique: vi.fn(),
		},
		gameListItem: {
			aggregate: vi.fn(),
			upsert: vi.fn(),
			deleteMany: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
		},
		game: { findUnique: vi.fn(), upsert: vi.fn() },
		user: { findUnique: vi.fn() },
		userGame: { findMany: vi.fn() },
		$transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
	},
}));

interface MockedDb {
	game: {
		findUnique: ReturnType<typeof vi.fn>;
		upsert: ReturnType<typeof vi.fn>;
	};
	gameList: {
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
		findMany: ReturnType<typeof vi.fn>;
		findUnique: ReturnType<typeof vi.fn>;
	};
	gameListItem: {
		aggregate: ReturnType<typeof vi.fn>;
		upsert: ReturnType<typeof vi.fn>;
		deleteMany: ReturnType<typeof vi.fn>;
		findMany: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
	};
	user: { findUnique: ReturnType<typeof vi.fn> };
	userGame: { findMany: ReturnType<typeof vi.fn> };
}

const mockedDb = db as unknown as MockedDb;

const sessionCtx = createTestContext({
	session: { user: { id: "user-1" } } as never,
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe("gameList.create", () => {
	it("creates a list owned by the current user", async () => {
		mockedDb.gameList.create.mockResolvedValue({
			id: "list-1",
			name: "Best RPGs",
			isPublic: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			_count: { items: 0 },
		});

		const caller = appRouter.createCaller(sessionCtx);
		const result = await caller.gameList.create({
			name: "Best RPGs",
			isPublic: false,
		});

		expect(mockedDb.gameList.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { userId: "user-1", name: "Best RPGs", isPublic: false },
			})
		);
		expect(result).toMatchObject({ id: "list-1", name: "Best RPGs" });
	});

	it("rejects when unauthenticated", async () => {
		const caller = appRouter.createCaller(createTestContext());

		await expect(
			caller.gameList.create({ name: "Backlog", isPublic: false })
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	it("surfaces a duplicate list name as a conflict", async () => {
		mockedDb.gameList.create.mockRejectedValue(new Error("unique violation"));

		const caller = appRouter.createCaller(sessionCtx);

		await expect(
			caller.gameList.create({ name: "Backlog", isPublic: false })
		).rejects.toMatchObject({ code: "CONFLICT" });
	});
});

describe("gameList.update / remove", () => {
	it("rejects updating a list owned by someone else", async () => {
		mockedDb.gameList.findUnique.mockResolvedValue({
			id: "list-1",
			userId: "someone-else",
		});

		const caller = appRouter.createCaller(sessionCtx);

		await expect(
			caller.gameList.update({ listId: "list-1", name: "Renamed" })
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	it("rejects deleting a list that does not exist", async () => {
		mockedDb.gameList.findUnique.mockResolvedValue(null);

		const caller = appRouter.createCaller(sessionCtx);

		await expect(
			caller.gameList.remove({ listId: "missing" })
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});

describe("gameList.get", () => {
	it("returns a public list to a signed-out visitor", async () => {
		mockedDb.gameList.findUnique.mockResolvedValue({
			id: "list-1",
			name: "Best RPGs",
			isPublic: true,
			userId: "owner-1",
			createdAt: new Date(),
			updatedAt: new Date(),
			_count: { items: 1 },
			items: [
				{
					game: {
						externalApiKey: "1",
						title: "Disco Elysium",
						coverUrl: null,
						trailerUrl: null,
						releaseDate: null,
						igdbScore: null,
					},
				},
			],
		});
		mockedDb.userGame.findMany.mockResolvedValue([]);

		const caller = appRouter.createCaller(createTestContext());
		const result = await caller.gameList.get({ listId: "list-1" });

		expect(result.isOwner).toBe(false);
		expect(result.items).toEqual([
			{
				igdbId: "1",
				title: "Disco Elysium",
				coverUrl: null,
				trailerVideoId: null,
				releaseDate: null,
				igdbScore: null,
				trackedStatus: null,
			},
		]);
	});

	it("hides a private list from a non-owner", async () => {
		mockedDb.gameList.findUnique.mockResolvedValue({
			id: "list-1",
			name: "Backlog",
			isPublic: false,
			userId: "owner-1",
			createdAt: new Date(),
			updatedAt: new Date(),
			_count: { items: 0 },
			items: [],
		});

		const caller = appRouter.createCaller(
			createTestContext({ session: { user: { id: "someone-else" } } as never })
		);

		await expect(
			caller.gameList.get({ listId: "list-1" })
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});

describe("gameList.reorder", () => {
	it("rewrites item positions to match the given order", async () => {
		mockedDb.gameList.findUnique.mockResolvedValue({
			id: "list-1",
			userId: "user-1",
		});
		mockedDb.gameListItem.findMany.mockResolvedValue([
			{ id: "item-a", game: { externalApiKey: "a" } },
			{ id: "item-b", game: { externalApiKey: "b" } },
		]);

		const caller = appRouter.createCaller(sessionCtx);
		await caller.gameList.reorder({
			listId: "list-1",
			orderedIgdbIds: ["b", "a"],
		});

		expect(mockedDb.gameListItem.update).toHaveBeenNthCalledWith(1, {
			where: { id: "item-b" },
			data: { position: 0 },
		});
		expect(mockedDb.gameListItem.update).toHaveBeenNthCalledWith(2, {
			where: { id: "item-a" },
			data: { position: 1 },
		});
	});
});
