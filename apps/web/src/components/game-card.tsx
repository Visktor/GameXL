import { Button } from "@GameXL/ui/components/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@GameXL/ui/components/hover-card";
import { useMutation } from "@tanstack/react-query";
import { Gamepad2, Heart, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { StarRating } from "@/components/star-rating";
import { trpcClient } from "@/utils/trpc";

export interface ReleaseGame {
	coverUrl: string | null;
	igdbId: string;
	igdbScore: number | null;
	releaseDate: number | null;
	title: string;
	trackedStatus: string | null;
	trailerVideoId: string | null;
}

export function GameCard({ game }: { game: ReleaseGame }) {
	const [trackedStatus, setTrackedStatus] = useState(game.trackedStatus);

	const addMutation = useMutation({
		mutationFn: (status: "PLAYING" | "WANT") =>
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
		onMutate: (status) => setTrackedStatus(status),
		onError: () => setTrackedStatus(game.trackedStatus),
	});

	const removeMutation = useMutation({
		mutationFn: () =>
			trpcClient.userGame.remove.mutate({ igdbId: game.igdbId }),
		onMutate: () => setTrackedStatus(null),
		onError: () => setTrackedStatus(game.trackedStatus),
	});

	return (
		<HoverCard>
			<HoverCardTrigger
				closeDelay={150}
				delay={300}
				render={<Link className="group block" to={`/games/${game.igdbId}`} />}
			>
				<div className="aspect-3/4 w-full overflow-hidden rounded-sm bg-muted">
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
				<p className="mt-1 line-clamp-2 text-sm">{game.title}</p>
				{game.igdbScore !== null && (
					<div className="mt-1">
						<StarRating score={game.igdbScore} />
					</div>
				)}
			</HoverCardTrigger>
			<HoverCardContent className="w-140 p-0" side="right">
				{/* Video or cover art */}
				<div className="aspect-video w-full overflow-hidden rounded-t-sm bg-muted">
					{game.trailerVideoId ? (
						<iframe
							allow="autoplay; encrypted-media"
							className="h-full w-full"
							src={`https://www.youtube.com/embed/${game.trailerVideoId}?autoplay=1&mute=1&controls=1`}
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
						<div className="flex gap-1">
							<Button
								disabled={addMutation.isPending || trackedStatus === "PLAYING"}
								onClick={(e) => {
									e.preventDefault();
									addMutation.mutate("PLAYING");
								}}
								size="sm"
								variant={trackedStatus === "PLAYING" ? "default" : "outline"}
							>
								<Gamepad2 className="h-4 w-4" />
								Playing
							</Button>
							<Button
								disabled={addMutation.isPending || trackedStatus === "WANT"}
								onClick={(e) => {
									e.preventDefault();
									addMutation.mutate("WANT");
								}}
								size="sm"
								variant={trackedStatus === "WANT" ? "default" : "outline"}
							>
								<Heart className="h-4 w-4" />
								Want
							</Button>
						</div>

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
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
