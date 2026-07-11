import db from "@GameXL/db";
import { TRPCError } from "@trpc/server";
import { gameStatusSchema } from "../schemas/user-game.schema";

const GAME_STATUSES = gameStatusSchema.options;

export interface UserProfile {
	createdAt: number;
	displayUsername: string | null;
	gameCountByStatus: Record<(typeof GAME_STATUSES)[number], number>;
	image: string | null;
	name: string;
	username: string;
}

export async function getUserByUsername({
	input,
}: {
	input: { username: string };
}): Promise<UserProfile> {
	const user = await db.user.findUnique({
		where: { username: input.username },
		select: {
			id: true,
			name: true,
			image: true,
			username: true,
			displayUsername: true,
			createdAt: true,
		},
	});

	if (!user?.username) {
		throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
	}

	const statusCounts = await db.userGame.groupBy({
		by: ["status"],
		where: { userId: user.id },
		_count: { _all: true },
	});

	const gameCountByStatus = Object.fromEntries(
		GAME_STATUSES.map((status) => [status, 0])
	) as UserProfile["gameCountByStatus"];

	for (const row of statusCounts) {
		gameCountByStatus[row.status] = row._count._all;
	}

	return {
		name: user.name,
		image: user.image,
		username: user.username,
		displayUsername: user.displayUsername,
		createdAt: user.createdAt.getTime(),
		gameCountByStatus,
	};
}
