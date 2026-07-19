import db from "@GameXL/db";
import { TRPCError } from "@trpc/server";
import type { Context } from "../context";
import { extractYoutubeVideoId } from "../lib/youtube";
import type {
	AddGameToListInput,
	CreateGameListInput,
	RemoveGameFromListInput,
	ReorderGameListInput,
	UpdateGameListInput,
} from "../schemas/game-list.schema";
import type { GameStatus } from "../schemas/user-game.schema";

export interface GameListSummary {
	createdAt: number;
	id: string;
	isPublic: boolean;
	itemCount: number;
	name: string;
	updatedAt: number;
}

export interface GameListItemEntry {
	coverUrl: string | null;
	igdbId: string;
	igdbScore: number | null;
	releaseDate: number | null;
	title: string;
	trackedStatus: GameStatus | null;
	trailerVideoId: string | null;
}

export interface GameListDetail extends GameListSummary {
	isOwner: boolean;
	items: GameListItemEntry[];
}

interface AuthedContext {
	session: NonNullable<Context["session"]>;
}

const listSummarySelect = {
	id: true,
	name: true,
	isPublic: true,
	createdAt: true,
	updatedAt: true,
	_count: { select: { items: true } },
} as const;

function mapListSummary(list: {
	id: string;
	name: string;
	isPublic: boolean;
	createdAt: Date;
	updatedAt: Date;
	_count: { items: number };
}): GameListSummary {
	return {
		id: list.id,
		name: list.name,
		isPublic: list.isPublic,
		itemCount: list._count.items,
		createdAt: list.createdAt.getTime(),
		updatedAt: list.updatedAt.getTime(),
	};
}

async function requireOwnedList(listId: string, userId: string) {
	const list = await db.gameList.findUnique({ where: { id: listId } });

	if (!list) {
		throw new TRPCError({ code: "NOT_FOUND", message: "List not found" });
	}

	if (list.userId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not own this list",
		});
	}

	return list;
}

export async function createGameList({
	input,
	ctx,
}: {
	input: CreateGameListInput;
	ctx: AuthedContext;
}): Promise<GameListSummary> {
	const userId = ctx.session.user.id;

	try {
		const list = await db.gameList.create({
			data: { userId, name: input.name, isPublic: input.isPublic },
			select: listSummarySelect,
		});
		return mapListSummary(list);
	} catch {
		throw new TRPCError({
			code: "CONFLICT",
			message: "You already have a list with this name",
		});
	}
}

export async function updateGameList({
	input,
	ctx,
}: {
	input: UpdateGameListInput;
	ctx: AuthedContext;
}): Promise<GameListSummary> {
	const userId = ctx.session.user.id;
	await requireOwnedList(input.listId, userId);

	try {
		const list = await db.gameList.update({
			where: { id: input.listId },
			data: {
				...(input.name !== undefined && { name: input.name }),
				...(input.isPublic !== undefined && { isPublic: input.isPublic }),
			},
			select: listSummarySelect,
		});
		return mapListSummary(list);
	} catch {
		throw new TRPCError({
			code: "CONFLICT",
			message: "You already have a list with this name",
		});
	}
}

export async function deleteGameList({
	input,
	ctx,
}: {
	input: { listId: string };
	ctx: AuthedContext;
}): Promise<void> {
	const userId = ctx.session.user.id;
	await requireOwnedList(input.listId, userId);

	await db.gameList.delete({ where: { id: input.listId } });
}

export async function getMyGameLists({
	ctx,
}: {
	ctx: AuthedContext;
}): Promise<GameListSummary[]> {
	const userId = ctx.session.user.id;

	const lists = await db.gameList.findMany({
		where: { userId },
		select: listSummarySelect,
		orderBy: { createdAt: "desc" },
	});

	return lists.map(mapListSummary);
}

export async function getGameListsByUsername({
	input,
}: {
	input: { username: string };
}): Promise<GameListSummary[]> {
	const user = await db.user.findUnique({
		where: { username: input.username },
		select: { id: true },
	});

	if (!user) {
		throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
	}

	const lists = await db.gameList.findMany({
		where: { userId: user.id, isPublic: true },
		select: listSummarySelect,
		orderBy: { createdAt: "desc" },
	});

	return lists.map(mapListSummary);
}

export async function getGameList({
	input,
	ctx,
}: {
	input: { listId: string };
	ctx: Pick<Context, "session" | "guestSession">;
}): Promise<GameListDetail> {
	const list = await db.gameList.findUnique({
		where: { id: input.listId },
		select: {
			...listSummarySelect,
			userId: true,
			items: {
				orderBy: { position: "asc" },
				select: {
					game: {
						select: {
							externalApiKey: true,
							title: true,
							coverUrl: true,
							trailerUrl: true,
							releaseDate: true,
							igdbScore: true,
						},
					},
				},
			},
		},
	});

	if (!list) {
		throw new TRPCError({ code: "NOT_FOUND", message: "List not found" });
	}

	const isOwner = ctx.session?.user.id === list.userId;
	if (!(list.isPublic || isOwner)) {
		throw new TRPCError({ code: "NOT_FOUND", message: "List not found" });
	}

	const trackedMap = new Map<string, GameStatus>();
	if (ctx.session || ctx.guestSession) {
		const trackedGames = await db.userGame.findMany({
			where: {
				game: {
					externalApiKey: { in: list.items.map((i) => i.game.externalApiKey) },
				},
				...(ctx.session
					? { userId: ctx.session.user.id }
					: { guestSessionId: ctx.guestSession?.id }),
			},
			select: { status: true, game: { select: { externalApiKey: true } } },
		});
		for (const tracked of trackedGames) {
			trackedMap.set(tracked.game.externalApiKey, tracked.status);
		}
	}

	return {
		...mapListSummary(list),
		isOwner,
		items: list.items.map((item) => ({
			igdbId: item.game.externalApiKey,
			title: item.game.title,
			coverUrl: item.game.coverUrl,
			trailerVideoId: extractYoutubeVideoId(item.game.trailerUrl),
			releaseDate: item.game.releaseDate
				? Math.floor(item.game.releaseDate.getTime() / 1000)
				: null,
			igdbScore: item.game.igdbScore?.toNumber() ?? null,
			trackedStatus: trackedMap.get(item.game.externalApiKey) ?? null,
		})),
	};
}

export async function addGameToList({
	input,
	ctx,
}: {
	input: AddGameToListInput;
	ctx: AuthedContext;
}): Promise<void> {
	const userId = ctx.session.user.id;
	await requireOwnedList(input.listId, userId);

	const { gameData } = input;

	const game = await db.game.upsert({
		where: { externalApiKey: gameData.igdbId },
		create: {
			externalApiKey: gameData.igdbId,
			title: gameData.title,
			coverUrl: gameData.coverUrl,
			trailerUrl: gameData.trailerVideoId
				? `https://www.youtube.com/watch?v=${gameData.trailerVideoId}`
				: null,
			releaseDate: gameData.releaseDate
				? new Date(gameData.releaseDate * 1000)
				: null,
			igdbScore: gameData.igdbScore,
		},
		update: {},
		select: { id: true },
	});

	const { _max } = await db.gameListItem.aggregate({
		where: { listId: input.listId },
		_max: { position: true },
	});
	const nextPosition = (_max.position ?? -1) + 1;

	await db.gameListItem.upsert({
		where: { listId_gameId: { listId: input.listId, gameId: game.id } },
		create: { listId: input.listId, gameId: game.id, position: nextPosition },
		update: {},
	});
}

export async function removeGameFromList({
	input,
	ctx,
}: {
	input: RemoveGameFromListInput;
	ctx: AuthedContext;
}): Promise<void> {
	const userId = ctx.session.user.id;
	await requireOwnedList(input.listId, userId);

	const game = await db.game.findUnique({
		where: { externalApiKey: input.igdbId },
		select: { id: true },
	});

	if (!game) {
		return;
	}

	await db.gameListItem.deleteMany({
		where: { listId: input.listId, gameId: game.id },
	});
}

export async function reorderGameList({
	input,
	ctx,
}: {
	input: ReorderGameListInput;
	ctx: AuthedContext;
}): Promise<void> {
	const userId = ctx.session.user.id;
	await requireOwnedList(input.listId, userId);

	const items = await db.gameListItem.findMany({
		where: { listId: input.listId },
		select: { id: true, game: { select: { externalApiKey: true } } },
	});

	const itemIdByIgdbId = new Map(
		items.map((item) => [item.game.externalApiKey, item.id])
	);

	const updates = input.orderedIgdbIds
		.map((igdbId, position) => {
			const itemId = itemIdByIgdbId.get(igdbId);
			return itemId ? { itemId, position } : null;
		})
		.filter((update): update is { itemId: string; position: number } =>
			Boolean(update)
		);

	await db.$transaction(
		updates.map(({ itemId, position }) =>
			db.gameListItem.update({ where: { id: itemId }, data: { position } })
		)
	);
}
