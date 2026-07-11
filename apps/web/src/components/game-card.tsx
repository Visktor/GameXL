import { Button } from "@GameXL/ui/components/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@GameXL/ui/components/hover-card";
import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Link } from "react-router";

import { StarRating } from "@/components/star-rating";
import { StatusSelect } from "@/components/status-select";
import { GAME_STATUS_META, type GameStatus } from "@/constants/game-status";
import { useTrackedGamesStore } from "@/stores/tracked-games-store";
import { trpcClient } from "@/utils/trpc";

export interface ReleaseGame {
	coverUrl: string | null;
	igdbId: string;
	igdbScore: number | null;
	releaseDate: number | null;
	title: string;
	trackedStatus: GameStatus | null;
	trailerVideoId: string | null;
	/** Epoch ms this game's tracked status was last updated. Only set on list pages. */
	updatedAt?: number;
}

function GameCover({
	className,
	game,
}: {
	className: string;
	game: ReleaseGame;
}) {
	return (
		<div className={`overflow-hidden rounded-sm bg-muted ${className}`}>
			{game.coverUrl ? (
				<img
					alt={game.title}
					className="h-full w-full object-cover transition-transform group-hover:scale-105"
					height={374}
					src={game.coverUrl}
					width={264}
				/>
			) : (
				<div className="flex h-full w-full items-center justify-center p-2 text-center text-muted-foreground text-xs">
					{game.title}
				</div>
			)}
		</div>
	);
}

function GameCardGridBody({ game }: { game: ReleaseGame }) {
	return (
		<>
			<GameCover className="aspect-3/4 w-full" game={game} />
			<p className="mt-1 line-clamp-2 text-sm">{game.title}</p>
			{game.igdbScore !== null && (
				<div className="mt-1">
					<StarRating score={game.igdbScore} />
				</div>
			)}
		</>
	);
}

function GameCardListBody({ game }: { game: ReleaseGame }) {
	return (
		<>
			<GameCover className="aspect-3/4 h-16 w-12 shrink-0" game={game} />
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm">{game.title}</p>
				{game.igdbScore !== null && (
					<div className="mt-0.5">
						<StarRating score={game.igdbScore} />
					</div>
				)}
			</div>
		</>
	);
}

export function GameCard({
	game,
	layout = "grid",
	readOnly = false,
}: {
	game: ReleaseGame;
	layout?: "grid" | "list";
	/** Viewing someone else's list: show status as a badge, no edit controls. */
	readOnly?: boolean;
}) {
	const isList = layout === "list";
	const storedStatus = useTrackedGamesStore(
		(state) => state.statusByGameId[game.igdbId]
	);
	const trackedStatus = readOnly
		? game.trackedStatus
		: (storedStatus ?? game.trackedStatus);
	const setTrackedStatus = useTrackedGamesStore((state) => state.setStatus);

	const addMutation = useMutation({
		mutationFn: (status: GameStatus) =>
			trpcClient.userGame.add.mutate({
				gameData: {
					igdbId: game.igdbId,
					title: game.title,
					coverUrl: game.coverUrl,
					trailerVideoId: game.trailerVideoId,
					releaseDate: game.releaseDate,
					igdbScore: game.igdbScore,
				},
				status,
			}),
		onMutate: (status) => setTrackedStatus(game.igdbId, status),
		onError: () => setTrackedStatus(game.igdbId, game.trackedStatus),
	});

	const removeMutation = useMutation({
		mutationFn: () =>
			trpcClient.userGame.remove.mutate({ igdbId: game.igdbId }),
		onMutate: () => setTrackedStatus(game.igdbId, null),
		onError: () => setTrackedStatus(game.igdbId, game.trackedStatus),
	});

	return (
		<HoverCard>
			<HoverCardTrigger
				closeDelay={150}
				delay={300}
				render={
					<Link
						className={
							isList
								? "group flex items-center gap-3 border-b py-2 last:border-b-0"
								: "group block"
						}
						to={`/games/${game.igdbId}`}
					/>
				}
			>
				{isList ? (
					<GameCardListBody game={game} />
				) : (
					<GameCardGridBody game={game} />
				)}
			</HoverCardTrigger>
			<HoverCardContent className="w-140 p-0" side="right">
				{/* Video or cover art */}
				<div className="aspect-video w-full overflow-hidden rounded-t-sm bg-muted">
					{game.trailerVideoId ? (
						<iframe
							allow="autoplay; encrypted-media"
							className="h-full w-full"
							src={`https://www.youtube.com/embed/${game.trailerVideoId}?autoplay=1&mute=1&controls=3`}
							title={game.title}
						/>
					) : null}
					{!game.trailerVideoId && game.coverUrl ? (
						<img
							alt={game.title}
							className="h-full w-full object-cover"
							height={374}
							src={game.coverUrl}
							width={264}
						/>
					) : null}
				</div>

				{/* Scores + actions */}
				<div className="p-3">
					<div className="mb-3 flex items-center justify-between text-sm">
						{game.igdbScore === null ? (
							<span className="text-muted-foreground text-xs">
								No IGDB score
							</span>
						) : (
							<span className="text-muted-foreground">
								IGDB{" "}
								<span className="font-medium text-foreground">
									{Math.round(game.igdbScore)}
								</span>
							</span>
						)}
					</div>

					<div className="flex items-center justify-between">
						{readOnly ? (
							trackedStatus && (
								<span className="flex items-center gap-1.5 text-muted-foreground text-xs">
									{(() => {
										const { icon: Icon, label } =
											GAME_STATUS_META[trackedStatus];
										return (
											<>
												<Icon className="h-4 w-4" />
												{label}
											</>
										);
									})()}
								</span>
							)
						) : (
							<>
								<StatusSelect
									disabled={addMutation.isPending}
									onChange={(status) => addMutation.mutate(status)}
									value={trackedStatus}
								/>

								{trackedStatus && (
									<Button
										disabled={removeMutation.isPending}
										onClick={(e) => {
											e.preventDefault();
											removeMutation.mutate();
										}}
										size="sm"
										variant="ghost"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</>
						)}
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
