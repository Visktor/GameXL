import type { ReleaseGame } from "@/components/game-card";
import { StarRating } from "@/components/star-rating";

const RATING_SCALE = 20;

export function SearchResultRow({ game }: { game: ReleaseGame }) {
	const year = game.releaseDate
		? new Date(game.releaseDate * 1000).getFullYear()
		: null;

	return (
		<div className="flex w-full items-center gap-3">
			<div className="aspect-3/4 h-12 shrink-0 overflow-hidden rounded-md bg-muted">
				{game.coverUrl ? (
					<img
						alt={game.title}
						className="h-full w-full object-cover"
						height={64}
						src={game.coverUrl}
						width={48}
					/>
				) : null}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm">{game.title}</p>
				<div className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
					{game.igdbScore !== null && (
						<>
							<StarRating score={game.igdbScore} />
							<span>{(game.igdbScore / RATING_SCALE).toFixed(1)}</span>
						</>
					)}
					{year ? <span>{year}</span> : null}
				</div>
			</div>
		</div>
	);
}
