import { TRPCClientError } from "@trpc/client";
import { useState } from "react";
import { useParams } from "react-router";

import { GameCard } from "@/components/game-card";
import { ImageLightbox } from "@/components/image-lightbox";
import Loader from "@/components/loader";
import { ScreenshotGrid } from "@/components/screenshot-grid";
import { StarRating } from "@/components/star-rating";
import { StatusButtonGroup } from "@/components/status-button-group";
import { WishlistButton } from "@/components/wishlist-button";
import { YouTubeTrailer } from "@/components/youtube-trailer";
import { GAME_STATUSES_ENUM, TRACK_STATUSES } from "@/constants/game-status";
import {
	IGDB_COVER_HEIGHT,
	IGDB_COVER_WIDTH,
	IGDB_SCREENSHOT_BIG_TEMPLATE,
	IGDB_SCREENSHOT_HUGE_TEMPLATE,
} from "@/constants/igdb";
import { useGameDetailQuery } from "@/hooks/use-game-detail-query";
import { NotFoundError } from "@/utils/errors";
import type { LightboxImage, LightboxTarget } from "@/utils/lightbox";
import { LightboxUtils } from "@/utils/lightbox";

export default function GameDetails() {
	const { igdbId } = useParams<{ igdbId: string }>();
	const [lightboxTarget, setLightboxTarget] = useState<LightboxTarget | null>(
		null
	);

	const { data, status, error, trackedStatus, addMutation, removeMutation } =
		useGameDetailQuery(igdbId);

	const [trailerFailed, setTrailerFailed] = useState(false);

	const isWishlistPending = addMutation.isPending || removeMutation.isPending;
	const handleToggleWishlist = () => {
		if (trackedStatus === GAME_STATUSES_ENUM.WISHLIST) {
			removeMutation.mutate();
		} else {
			addMutation.mutate(GAME_STATUSES_ENUM.WISHLIST);
		}
	};

	if (!igdbId) {
		throw new NotFoundError("Missing igdbId route param");
	}

	if (status === "pending") {
		return <Loader />;
	}

	if (status === "error") {
		if (error instanceof TRPCClientError && error.data?.code === "NOT_FOUND") {
			throw new NotFoundError("Game not found");
		}
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">
					Failed to load game. Please try again.
				</p>
			</div>
		);
	}

	const releaseYear = data.releaseDate
		? new Date(data.releaseDate * 1000).getFullYear()
		: null;

	const coverImage: LightboxImage | null = data.coverUrl
		? { alt: data.title, url: data.coverUrl }
		: null;

	const screenshotImages: LightboxImage[] = data.screenshots.map((url, i) => ({
		alt: `${data.title} screenshot ${i + 1}`,
		url: url.replace(
			IGDB_SCREENSHOT_BIG_TEMPLATE,
			IGDB_SCREENSHOT_HUGE_TEMPLATE
		),
	}));

	const selectedImage = LightboxUtils.getImage(
		lightboxTarget,
		coverImage,
		screenshotImages
	);

	const lightboxImageCount =
		lightboxTarget?.kind === "screenshot" ? screenshotImages.length : 1;

	const navigateLightbox = (direction: -1 | 1) => {
		if (lightboxTarget?.kind !== "screenshot") {
			return;
		}

		setLightboxTarget({
			index: LightboxUtils.getNextIndex(
				lightboxTarget.index,
				direction,
				screenshotImages.length
			),
			kind: "screenshot",
		});
	};

	return (
		<main className="h-full overflow-y-auto p-4">
			<div className="mx-auto flex max-w-5xl flex-col gap-6">
				<div className="flex flex-col gap-6 sm:flex-row">
					<div className="aspect-3/4 w-full shrink-0 overflow-hidden rounded-sm bg-muted sm:w-56">
						{data.coverUrl ? (
							<button
								aria-label={`Expand cover art for ${data.title}`}
								className="h-full w-full cursor-pointer transition-opacity hover:opacity-90"
								onClick={() => setLightboxTarget({ kind: "cover" })}
								type="button"
							>
								<img
									alt={data.title}
									className="h-full w-full object-cover"
									height={IGDB_COVER_HEIGHT}
									src={data.coverUrl}
									width={IGDB_COVER_WIDTH}
								/>
							</button>
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

						<div className="mt-auto flex flex-wrap items-center gap-1.5">
							<WishlistButton
								isPending={isWishlistPending}
								onToggle={handleToggleWishlist}
								trackedStatus={trackedStatus ?? null}
							/>
							<StatusButtonGroup
								disabled={isWishlistPending}
								onChange={(trackStatus) =>
									trackStatus
										? addMutation.mutate(trackStatus)
										: removeMutation.mutate()
								}
								statuses={TRACK_STATUSES}
								value={trackedStatus ?? null}
							/>
						</div>
					</div>
				</div>

				{data.trailerVideoId && !trailerFailed && (
					<div className="aspect-video w-full overflow-hidden rounded-sm bg-muted">
						<YouTubeTrailer
							onEmbedFailure={() => setTrailerFailed(true)}
							title={data.title}
							videoId={data.trailerVideoId}
						/>
					</div>
				)}

				<ScreenshotGrid
					onSelect={(index) => setLightboxTarget({ index, kind: "screenshot" })}
					screenshots={data.screenshots}
					title={data.title}
				/>

				{data.similarGames.length > 0 && (
					<div className="flex flex-col gap-2">
						<h2 className="font-semibold text-lg">Similar Games</h2>
						<div className="flex gap-4 overflow-x-auto pb-2">
							{data.similarGames.map((similarGame) => (
								<div className="w-36 shrink-0 sm:w-40" key={similarGame.igdbId}>
									<GameCard game={similarGame} imagePriority="low" />
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			<ImageLightbox
				image={selectedImage}
				imageCount={lightboxImageCount}
				onNavigate={navigateLightbox}
				onOpenChange={(open) => !open && setLightboxTarget(null)}
				open={lightboxTarget !== null}
			/>
		</main>
	);
}
