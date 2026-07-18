import type { ReactNode } from "react";
import { Link } from "react-router";
import { GameCover } from "./game-cover";
import type { ReleaseGame } from "./types";

export function GameCardListBody({
	children,
	game,
	imagePriority,
}: {
	children: ReactNode;
	game: ReleaseGame;
	imagePriority: "auto" | "high" | "low";
}) {
	return (
		<>
			<Link className="shrink-0" to={`/games/${game.igdbId}`}>
				<GameCover
					className="aspect-3/4 h-16 w-12 rounded-sm"
					game={game}
					imagePriority={imagePriority}
				/>
			</Link>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm">{game.title}</p>
				<div className="mt-0.5">{children}</div>
			</div>
		</>
	);
}
