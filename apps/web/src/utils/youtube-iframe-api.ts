export interface YTPlayerError {
	data: number;
	target: YTPlayer;
}

export interface YTPlayer {
	destroy: () => void;
	getIframe: () => HTMLIFrameElement;
}

interface YTPlayerOptions {
	events?: {
		onError?: (event: YTPlayerError) => void;
		onReady?: (event: { target: YTPlayer }) => void;
	};
	playerVars?: {
		autoplay?: 0 | 1;
		controls?: 0 | 1;
		mute?: 0 | 1;
	};
	videoId: string;
}

interface YT {
	Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer;
}

declare global {
	interface Window {
		onYouTubeIframeAPIReady?: () => void;
		YT?: YT;
	}
}

let apiPromise: Promise<YT> | null = null;

/**
 * The raw `<iframe src="youtube.com/embed/...">` approach can't tell us when
 * YouTube refuses to play a video in a third-party embed (e.g. age-restricted
 * videos) — the iframe is cross-origin, so we can't read its content. The
 * official IFrame Player API talks back to the parent page via postMessage
 * and fires `onError`, which is the only reliable signal for this.
 */
export function loadYouTubeIframeApi(): Promise<YT> {
	if (apiPromise) {
		return apiPromise;
	}

	apiPromise = new Promise((resolve) => {
		if (window.YT?.Player) {
			resolve(window.YT);
			return;
		}

		const previousReady = window.onYouTubeIframeAPIReady;
		window.onYouTubeIframeAPIReady = () => {
			previousReady?.();
			resolve(window.YT as YT);
		};

		const tag = document.createElement("script");
		tag.src = "https://www.youtube.com/iframe_api";
		document.head.appendChild(tag);
	});

	return apiPromise;
}
