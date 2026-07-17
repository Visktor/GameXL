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

describe("releases.list", () => {
	it("maps IGDB games and tracked status for a guest session", async () => {
		vi.mocked(queryIGDB).mockResolvedValue([
			{
				id: 1,
				name: "Hollow Knight",
				first_release_date: 1_600_000_000,
				rating: 90,
			},
		]);
		mockedDb.userGame.findMany.mockResolvedValue([
			{ status: "WISHLIST", game: { externalApiKey: "1" } },
		]);

		const caller = appRouter.createCaller(
			createTestContext({
				guestSession: { id: "guest-1", token: "t", fingerprint: "f" },
			})
		);

		const result = await caller.releases.list({
			offset: 0,
			span: "week",
			sortBy: "popularity",
		});

		expect(result.games).toEqual([
			{
				igdbId: "1",
				title: "Hollow Knight",
				coverUrl: null,
				trailerVideoId: null,
				releaseDate: 1_600_000_000,
				igdbScore: 90,
				trackedStatus: "WISHLIST",
			},
		]);
		expect(result.nextOffset).toBeNull();
	});

	it("returns an empty page without querying tracked status when IGDB has no results", async () => {
		vi.mocked(queryIGDB).mockResolvedValue([]);

		const caller = appRouter.createCaller(createTestContext());

		const result = await caller.releases.list({
			offset: 0,
			span: "today",
			sortBy: "date",
		});

		expect(result).toEqual({ games: [], nextOffset: null });
		expect(mockedDb.userGame.findMany).not.toHaveBeenCalled();
	});

	it("wraps an IGDB failure in a TRPCError", async () => {
		vi.mocked(queryIGDB).mockRejectedValue(new Error("network down"));

		const caller = appRouter.createCaller(createTestContext());

		await expect(
			caller.releases.list({ offset: 0, span: "month", sortBy: "score" })
		).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
	});
});
