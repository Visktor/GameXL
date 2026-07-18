import { cn } from "@GameXL/ui/lib/utils";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router";
import type { ReleaseGame } from "./types";

export function ExpandToFullPageLink({
	className,
	game,
}: {
	className: string;
	game: ReleaseGame;
}) {
	return (
		<Link
			aria-label={`Open ${game.title}'s full page`}
			className={cn(
				"z-10 rounded-full bg-background/70 p-1 text-foreground opacity-0 transition-opacity hover:bg-background group-hover:opacity-100",
				className
			)}
			onClick={(e) => e.stopPropagation()}
			to={`/games/${game.igdbId}`}
		>
			<ExternalLink className="h-3.5 w-3.5" />
		</Link>
	);
}
