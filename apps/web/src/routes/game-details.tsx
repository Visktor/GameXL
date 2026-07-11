import { Button } from "@GameXL/ui/components/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { Gamepad2, Heart, Trash2 } from "lucide-react";
import { useParams } from "react-router";

import Loader from "@/components/loader";
import { StarRating } from "@/components/star-rating";
import { useTrackedGamesStore } from "@/stores/tracked-games-store";
import { trpcClient } from "@/utils/trpc";

export default function GameDetails() {
	const { igdbId } = useParams<{ igdbId: string }>();

	const { data, status, error } = useQuery({
		queryKey: ["game", igdbId],
		queryFn: () => trpcClient.game.getById.query({ igdbId: igdbId ?? "" }),
		enabled: Boolean(igdbId),
	});

	const trackedStatus = useTrackedGamesStore(
		(state) =>
			(igdbId ? state.statusByGameId[igdbId] : undefined) ?? data?.trackedStatus
	);
	const setTrackedStatus = useTrackedGamesStore((state) => state.setStatus);

	const addMutation = useMutation({
		mutationFn: (status: "PLAYING" | "WANT") =>
			trpcClient.userGame.add.mutate({
				gameData: {
					igdbId: data?.igdbId ?? "",
					title: data?.title ?? "",
					coverUrl: data?.coverUrl ?? null,
					trailerVideoId: data?.trailerVideoId ?? null,
					releaseDate: data?.releaseDate ?? null,
					igdbScore: data?.igdbScore ?? null,
				},
				status,
			}),
		onMutate: (status) => igdbId && setTrackedStatus(igdbId, status),
		onError: () =>
			igdbId && setTrackedStatus(igdbId, data?.trackedStatus ?? null),
	});

	const removeMutation = useMutation({
		mutationFn: () =>
			trpcClient.userGame.remove.mutate({ igdbId: igdbId ?? "" }),
		onMutate: () => igdbId && setTrackedStatus(igdbId, null),
		onError: () =>
			igdbId && setTrackedStatus(igdbId, data?.trackedStatus ?? null),
	});

	if (status === "pending") {
		return <Loader />;
	}

	if (status === "error") {
		const notFound =
			error instanceof TRPCClientError && error.data?.code === "NOT_FOUND";
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">
					{notFound
						? "Game not found."
						: "Failed to load game. Please try again."}
				</p>
			</div>
		);
	}

	const releaseYear = data.releaseDate
		? new Date(data.releaseDate * 1000).getFullYear()
		: null;

	return (
		<main className="h-full overflow-y-auto p-4">
			<div className="mx-auto flex max-w-5xl flex-col gap-6">
				<div className="flex flex-col gap-6 sm:flex-row">
					<div className="aspect-3/4 w-full shrink-0 overflow-hidden rounded-sm bg-muted sm:w-56">
						{data.coverUrl ? (
							<img
								alt={data.title}
								className="h-full w-full object-cover"
								height={374}
								src={data.coverUrl}
								width={264}
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center p-2 text-center text-muted-foreground text-xs">
								{data.title}
							</div>
						)}
					</div>

					<div className="flex flex-1 flex-col gap-3">
						<div>
							<h1 className="font-semibold text-2xl">{data.title}</h1>
							<p className="text-muted-foreground text-sm">
								{[data.developer, releaseYear].filter(Boolean).join(" · ")}
							</p>
						</div>

						{data.igdbScore !== null && (
							<div className="flex items-center gap-2">
								<StarRating score={data.igdbScore} />
								<span className="text-muted-foreground text-sm">
									{Math.round(data.igdbScore)} / 100
								</span>
							</div>
						)}

						{(data.genres.length > 0 || data.platforms.length > 0) && (
							<div className="flex flex-wrap gap-1.5">
								{[...data.genres, ...data.platforms].map((tag) => (
									<span
										className="rounded-none border px-2 py-0.5 text-muted-foreground text-xs"
										key={tag}
									>
										{tag}
									</span>
								))}
							</div>
						)}

						{data.summary && (
							<p className="text-sm leading-relaxed">{data.summary}</p>
						)}

						<div className="mt-auto flex items-center gap-1.5">
							<Button
								disabled={addMutation.isPending || trackedStatus === "PLAYING"}
								onClick={() => addMutation.mutate("PLAYING")}
								size="sm"
								variant={trackedStatus === "PLAYING" ? "default" : "outline"}
							>
								<Gamepad2 className="h-4 w-4" />
								Playing
							</Button>
							<Button
								disabled={addMutation.isPending || trackedStatus === "WANT"}
								onClick={() => addMutation.mutate("WANT")}
								size="sm"
								variant={trackedStatus === "WANT" ? "default" : "outline"}
							>
								<Heart className="h-4 w-4" />
								Want
							</Button>
							{trackedStatus && (
								<Button
									disabled={removeMutation.isPending}
									onClick={() => removeMutation.mutate()}
									size="sm"
									variant="ghost"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>
				</div>

				{data.trailerVideoId && (
					<div className="aspect-video w-full overflow-hidden rounded-sm bg-muted">
						<iframe
							allow="autoplay; encrypted-media"
							className="h-full w-full"
							src={`https://www.youtube.com/embed/${data.trailerVideoId}?controls=1`}
							title={data.title}
						/>
					</div>
				)}

				{data.screenshots.length > 0 && (
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{data.screenshots.map((url) => (
							<div
								className="aspect-video overflow-hidden rounded-sm bg-muted"
								key={url}
							>
								<img
									alt={`${data.title} screenshot`}
									className="h-full w-full object-cover"
									height={360}
									src={url}
									width={640}
								/>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
