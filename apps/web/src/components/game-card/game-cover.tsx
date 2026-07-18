import { cn } from "@GameXL/ui/lib/utils";
import { Video, VideoOff } from "lucide-react";
import type { ReleaseGame } from "./types";

export function GameCover({
	className,
	game,
	imagePriority,
}: {
	className: string;
	game: ReleaseGame;
	imagePriority: "auto" | "high" | "low";
}) {
	const hasTrailer = Boolean(game.trailerVideoId);
	const TrailerIcon = hasTrailer ? Video : VideoOff;

	return (
		<div className={cn("relative overflow-hidden bg-muted", className)}>
			{game.coverUrl ? (
				<img
					alt={game.title}
					className="h-full w-full object-cover transition-transform group-hover:scale-105"
					fetchPriority={imagePriority}
					height={374}
					src={game.coverUrl}
					width={264}
				/>
			) : (
				<div className="flex h-full w-full items-center justify-center p-2 text-center text-muted-foreground text-xs">
					{game.title}
				</div>
			)}
			<span
				aria-label={hasTrailer ? "Trailer available" : "No trailer available"}
				className="absolute right-1 bottom-1 rounded-full bg-background/70 p-1 text-foreground"
				role="img"
			>
				<TrailerIcon className="h-3 w-3" />
			</span>
		</div>
	);
}
