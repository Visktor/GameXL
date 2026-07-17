import db from "@GameXL/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "@/routers/index";
import { createTestContext } from "../support/context";

vi.mock("@GameXL/db", () => ({
	createPrismaClient: vi.fn(),
	default: {
		game: { findUnique: vi.fn(), upsert: vi.fn() },
		userGame: { deleteMany: vi.fn(), upsert: vi.fn() },
	},
}));

interface MockedDb {
	game: {
		findUnique: ReturnType<typeof vi.fn>;
		upsert: ReturnType<typeof vi.fn>;
	};
	userGame: {
		deleteMany: ReturnType<typeof vi.fn>;
		upsert: ReturnType<typeof vi.fn>;
	};
}

const mockedDb = db as unknown as MockedDb;

const gameData = {
	igdbId: "1",
	title: "Hollow Knight",
	coverUrl: null,
	trailerVideoId: "abc123",
	releaseDate: 1_600_000_000,
	igdbScore: 90,
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("userGame.add", () => {
	it("tracks a game for a signed-in user", async () => {
		mockedDb.game.upsert.mockResolvedValue({ id: "game-1" });
		mockedDb.userGame.upsert.mockResolvedValue({});

		const ctx = createTestContext({
			session: { user: { id: "user-1" } } as never,
		});
		const caller = appRouter.createCaller(ctx);

		await caller.userGame.add({ gameData, status: "WISHLIST" });

		expect(mockedDb.game.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { externalApiKey: "1" },
				create: expect.objectContaining({
					externalApiKey: "1",
					title: "Hollow Knight",
					trailerUrl: "https://www.youtube.com/watch?v=abc123",
				}),
			})
		);
		expect(mockedDb.userGame.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId_gameId: { userId: "user-1", gameId: "game-1" } },
				create: { userId: "user-1", gameId: "game-1", status: "WISHLIST" },
			})
		);
		expect(ctx.logger.info).toHaveBeenCalledWith(
			expect.objectContaining({ event: "game.tracked" }),
			"Game tracked"
		);
	});

	it("rejects a guest with no session and no fingerprint", async () => {
		const caller = appRouter.createCaller(createTestContext());

		await expect(
			caller.userGame.add({ gameData, status: "WISHLIST" })
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});
});

describe("userGame.remove", () => {
	it("removes the tracked game when it exists", async () => {
		mockedDb.game.findUnique.mockResolvedValue({ id: "game-1" });

		const caller = appRouter.createCaller(
			createTestContext({ session: { user: { id: "user-1" } } as never })
		);

		await caller.userGame.remove({ igdbId: "1" });

		expect(mockedDb.userGame.deleteMany).toHaveBeenCalledWith({
			where: { userId: "user-1", gameId: "game-1" },
		});
	});

	it("is a no-op when the game was never tracked", async () => {
		mockedDb.game.findUnique.mockResolvedValue(null);

		const caller = appRouter.createCaller(
			createTestContext({ session: { user: { id: "user-1" } } as never })
		);

		await caller.userGame.remove({ igdbId: "999" });

		expect(mockedDb.userGame.deleteMany).not.toHaveBeenCalled();
	});
});
