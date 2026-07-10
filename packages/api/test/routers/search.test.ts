import db from "@GameXL/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryIGDB } from "@/lib/igdb";
import { appRouter } from "@/routers/index";
import { createTestContext } from "../support/context";

vi.mock("@GameXL/db", () => ({
	createPrismaClient: vi.fn(),
	default: {
		userGame: { findMany: vi.fn() },
	},
}));

vi.mock("@/lib/igdb", () => ({
	queryIGDB: vi.fn(),
	resolveCoverUrl: () => null,
	resolveTrailerVideoId: () => null,
}));

interface MockedDb {
	userGame: { findMany: ReturnType<typeof vi.fn> };
}

const mockedDb = db as unknown as MockedDb;

beforeEach(() => {
	vi.clearAllMocks();
});

describe("search.list", () => {
	it("uses the contains filter clause by default", async () => {
		vi.mocked(queryIGDB).mockResolvedValue([]);

		const caller = appRouter.createCaller(createTestContext());

		await caller.search.list({ offset: 0, q: "penguin lif" });

		expect(queryIGDB).toHaveBeenCalledWith(
			"games",
			expect.stringContaining('where name ~ *"penguin lif"*;')
		);
	});

	it("uses the fulltext search clause when mode is fulltext", async () => {
		vi.mocked(queryIGDB).mockResolvedValue([]);

		const caller = appRouter.createCaller(createTestContext());

		await caller.search.list({
			offset: 0,
			q: "hollow knight",
			mode: "fulltext",
		});

		expect(queryIGDB).toHaveBeenCalledWith(
			"games",
			expect.stringContaining('search "hollow knight";')
		);
	});

	it("maps results and tracked status for a signed-in user", async () => {
		vi.mocked(queryIGDB).mockResolvedValue([{ id: 42, name: "Celeste" }]);
		mockedDb.userGame.findMany.mockResolvedValue([
			{ status: "PLAYING", game: { externalApiKey: "42" } },
		]);

		const caller = appRouter.createCaller(
			createTestContext({
				session: { user: { id: "user-1" } } as never,
			})
		);

		const result = await caller.search.list({ offset: 0, q: "celeste" });

		expect(result.games[0]).toMatchObject({
			igdbId: "42",
			title: "Celeste",
			trackedStatus: "PLAYING",
		});
	});
});
