import type { ReleaseGame } from "@/components/game-card";

export function SearchResultRow({ game }: { game: ReleaseGame }) {
	const year = game.releaseDate
		? new Date(game.releaseDate * 1000).getFullYear()
		: null;

	return (
		<div className="flex w-full items-center gap-2.5">
			<div className="aspect-3/4 h-10 shrink-0 overflow-hidden rounded-sm bg-muted">
				{game.coverUrl ? (
					<img
						alt={game.title}
						className="h-full w-full object-cover"
						height={53}
						src={game.coverUrl}
						width={40}
					/>
				) : null}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm">{game.title}</p>
				{year ? <p className="text-muted-foreground text-xs">{year}</p> : null}
			</div>
		</div>
	);
}
