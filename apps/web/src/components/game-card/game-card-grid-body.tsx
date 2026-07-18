import type { ReactNode } from "react";
import { Link } from "react-router";
import { GameCover } from "./game-cover";
import type { ReleaseGame } from "./types";

export function GameCardGridBody({
	children,
	game,
	imagePriority,
}: {
	children: ReactNode;
	game: ReleaseGame;
	imagePriority: "auto" | "high" | "low";
}) {
	return (
		<div className="overflow-hidden rounded-sm border border-border">
			<Link className="block" to={`/games/${game.igdbId}`}>
				<GameCover
					className="aspect-3/4 w-full"
					game={game}
					imagePriority={imagePriority}
				/>
			</Link>
			<div className="p-2">
				{/* Truncated to 1 line (not 2) so every grid card measures the same
				height regardless of title length — VirtuosoGrid assumes uniform
				item size and jitters otherwise. */}
				<p className="truncate text-sm">{game.title}</p>
				<div className="mt-1">{children}</div>
			</div>
		</div>
	);
}
