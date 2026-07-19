const YOUTUBE_WATCH_ID_PARAM = "v";

export function extractYoutubeVideoId(
	trailerUrl: string | null
): string | null {
	if (!trailerUrl) {
		return null;
	}

	try {
		return new URL(trailerUrl).searchParams.get(YOUTUBE_WATCH_ID_PARAM);
	} catch {
		return null;
	}
}
