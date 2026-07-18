import { Button } from "@GameXL/ui/components/button";
import { TRPCClientError } from "@trpc/client";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import { ImageLightbox } from "@/components/image-lightbox";
import Loader from "@/components/loader";
import { ScreenshotGrid } from "@/components/screenshot-grid";
import { StarRating } from "@/components/star-rating";
import { StatusButtonGroup } from "@/components/status-button-group";
import { WishlistButton } from "@/components/wishlist-button";
import { YouTubeTrailer } from "@/components/youtube-trailer";
import { GAME_STATUSES_ENUM, TRACK_STATUSES } from "@/constants/game-status";
import {
	IGDB_SCREENSHOT_BIG_TEMPLATE,
	IGDB_SCREENSHOT_HUGE_TEMPLATE,
} from "@/constants/igdb";
import { useGameDetailQuery } from "@/hooks/use-game-detail-query";
import type { LightboxImage, LightboxTarget } from "@/utils/lightbox";
import { LightboxUtils } from "@/utils/lightbox";

export function GamePreviewPanelContent({ igdbId }: { igdbId: string }) {
	const [lightboxTarget, setLightboxTarget] = useState<LightboxTarget | null>(
		null
	);
	const [trailerFailed, setTrailerFailed] = useState(false);

	const { data, status, error, trackedStatus, addMutation, removeMutation } =
		useGameDetailQuery(igdbId);

	if (status === "pending") {
		return (
			<div className="flex flex-1 items-center justify-center">
				<Loader />
			</div>
		);
	}

	if (status === "error") {
		const notFound =
			error instanceof TRPCClientError && error.data?.code === "NOT_FOUND";
		return (
			<div className="flex flex-1 items-center justify-center p-4">
				<p className="text-muted-foreground text-sm">
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

	const screenshotImages: LightboxImage[] = data.screenshots.map((url, i) => ({
		alt: `${data.title} screenshot ${i + 1}`,
		url: url.replace(
			IGDB_SCREENSHOT_BIG_TEMPLATE,
			IGDB_SCREENSHOT_HUGE_TEMPLATE
		),
	}));

	const selectedImage = LightboxUtils.getImage(
		lightboxTarget,
		null,
		screenshotImages
	);

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
		<div className="flex-1 overflow-y-auto p-4">
			<div className="flex flex-col gap-4">
				{data.trailerVideoId && !trailerFailed ? (
					<div className="aspect-video w-full overflow-hidden rounded-sm bg-muted">
						<YouTubeTrailer
							onEmbedFailure={() => setTrailerFailed(true)}
							title={data.title}
							videoId={data.trailerVideoId}
						/>
					</div>
				) : (
					data.coverUrl && (
						<div className="aspect-video w-full overflow-hidden rounded-sm bg-muted">
							{/* biome-ignore lint/correctness/useImageSize: cover art dimensions vary per game; rendered inside a fixed aspect-video box, so no layout shift occurs */}
							<img
								alt={data.title}
								className="h-full w-full object-cover"
								src={data.coverUrl}
							/>
						</div>
					)
				)}

				<div>
					<h2 className="font-semibold text-xl">{data.title}</h2>
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

				<div className="flex flex-wrap items-center gap-1.5">
					<WishlistButton
						isPending={addMutation.isPending || removeMutation.isPending}
						onToggle={() => {
							if (trackedStatus === GAME_STATUSES_ENUM.WISHLIST) {
								removeMutation.mutate();
							} else {
								addMutation.mutate(GAME_STATUSES_ENUM.WISHLIST);
							}
						}}
						trackedStatus={trackedStatus ?? null}
						variant="full"
					/>
					<StatusButtonGroup
						disabled={addMutation.isPending}
						onChange={(trackStatus) => addMutation.mutate(trackStatus)}
						statuses={TRACK_STATUSES}
						value={trackedStatus ?? null}
					/>
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

				<ScreenshotGrid
					onSelect={(index) => setLightboxTarget({ index, kind: "screenshot" })}
					screenshots={data.screenshots}
					title={data.title}
				/>
			</div>

			<ImageLightbox
				image={selectedImage}
				imageCount={screenshotImages.length}
				onNavigate={navigateLightbox}
				onOpenChange={(open) => !open && setLightboxTarget(null)}
				open={lightboxTarget !== null}
			/>
		</div>
	);
}
