import { Button } from "@GameXL/ui/components/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@GameXL/ui/components/hover-card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Gamepad2, Heart, Trash2, Video, VideoOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { StarRating } from "@/components/star-rating";
import { StatusButtonGroup } from "@/components/status-select";
import { YouTubeTrailer } from "@/components/youtube-trailer";
import {
	GAME_STATUS_META,
	GAME_STATUSES,
	type GameStatus,
} from "@/constants/game-status";
import { useTrackedGamesStore } from "@/stores/tracked-games-store";
import { trpcClient } from "@/utils/trpc";

const TRACK_STATUSES = GAME_STATUSES.filter((status) => status !== "WANT");

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
	const hasTrailer = Boolean(game.trailerVideoId);
	const TrailerIcon = hasTrailer ? Video : VideoOff;

	return (
		<div
			className={`relative overflow-hidden rounded-sm bg-muted ${className}`}
		>
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

function GameCardGridBody({ game }: { game: ReleaseGame }) {
	return (
		<>
			<GameCover className="aspect-3/4 w-full" game={game} />
			{/* Truncated to 1 line (not 2) so every grid card measures the same
			height regardless of title length — VirtuosoGrid assumes uniform
			item size and jitters otherwise. */}
			<p className="mt-1 truncate text-sm">{game.title}</p>
			{/* Always mounted (just hidden) so every grid card measures the same
			height — VirtuosoGrid assumes uniform item size and jitters otherwise. */}
			<div className={`mt-1 ${game.igdbScore === null ? "invisible" : ""}`}>
				<StarRating score={game.igdbScore ?? 0} />
			</div>
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

function HoverPreviewMedia({
	game,
	isOpen,
}: {
	game: ReleaseGame;
	isOpen: boolean;
}) {
	const hasTrailer = Boolean(game.trailerVideoId);
	const [trailerFailed, setTrailerFailed] = useState(false);
	const needsScreenshot = !hasTrailer || trailerFailed;

	const screenshotsQuery = useQuery({
		queryKey: ["game-screenshots", game.igdbId],
		queryFn: () =>
			trpcClient.game.getScreenshots.query({ igdbId: game.igdbId }),
		enabled: isOpen && needsScreenshot,
	});

	return (
		<div className="aspect-video w-full overflow-hidden rounded-t-sm bg-muted">
			{hasTrailer && !trailerFailed ? (
				<YouTubeTrailer
					autoplay
					onEmbedFailure={() => setTrailerFailed(true)}
					title={game.title}
					videoId={game.trailerVideoId as string}
				/>
			) : (
				needsScreenshot &&
				screenshotsQuery.data &&
				(screenshotsQuery.data.screenshots[0] ? (
					// biome-ignore lint/correctness/useImageSize: dimensions vary per screenshot and aren't known before load; rendered inside a fixed aspect-video box, so no layout shift occurs
					<img
						alt={game.title}
						className="h-full w-full object-cover"
						src={screenshotsQuery.data.screenshots[0]}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center">
						<Gamepad2 className="h-8 w-8 text-muted-foreground" />
					</div>
				))
			)}
		</div>
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
	const [isHoverCardOpen, setIsHoverCardOpen] = useState(false);

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
		<HoverCard onOpenChange={setIsHoverCardOpen}>
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
				<HoverPreviewMedia game={game} isOpen={isHoverCardOpen} />

				{/* Scores + actions */}
				<div className="p-3">
					<div className="mb-3 flex items-center gap-2 text-sm">
						{readOnly ? (
							<Heart
								className={
									trackedStatus === "WANT"
										? "h-4 w-4 fill-rose-500 text-rose-500"
										: "h-4 w-4 text-muted-foreground"
								}
							/>
						) : (
							<Button
								aria-label={
									trackedStatus === "WANT"
										? "Remove from want to play"
										: "Want to play"
								}
								aria-pressed={trackedStatus === "WANT"}
								disabled={addMutation.isPending || removeMutation.isPending}
								onClick={(e) => {
									e.preventDefault();
									if (trackedStatus === "WANT") {
										removeMutation.mutate();
									} else {
										addMutation.mutate("WANT");
									}
								}}
								size="icon-xs"
								type="button"
								variant="ghost"
							>
								<Heart
									className={
										trackedStatus === "WANT"
											? "h-4 w-4 fill-rose-500 text-rose-500"
											: "h-4 w-4"
									}
								/>
							</Button>
						)}

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

					<div className="flex flex-wrap items-center gap-1.5">
						{readOnly ? (
							trackedStatus &&
							trackedStatus !== "WANT" && (
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
								<StatusButtonGroup
									disabled={addMutation.isPending}
									onChange={(status) => addMutation.mutate(status)}
									statuses={TRACK_STATUSES}
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
