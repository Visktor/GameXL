import { useQuery } from "@tanstack/react-query";
import { Gamepad2 } from "lucide-react";
import { useState } from "react";
import { YouTubeTrailer } from "@/components/youtube-trailer";
import { trpcClient } from "@/utils/trpc";
import type { ReleaseGame } from "./types";

export function HoverPreviewMedia({
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
