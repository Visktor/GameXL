import { useEffect, useRef } from "react";

import {
	loadYouTubeIframeApi,
	type YTPlayer,
} from "@/utils/youtube-iframe-api";

export function YouTubeTrailer({
	autoplay = false,
	onEmbedFailure,
	title,
	videoId,
}: {
	autoplay?: boolean;
	onEmbedFailure: () => void;
	title: string;
	videoId: string;
}) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const onEmbedFailureRef = useRef(onEmbedFailure);
	onEmbedFailureRef.current = onEmbedFailure;

	useEffect(() => {
		const wrapper = wrapperRef.current;
		if (!wrapper) {
			return;
		}

		// YT.Player replaces the element it's given with its own <iframe> —
		// it doesn't just fill it. Handing it a React-owned node would leave
		// React's tree pointing at a node that's no longer there, crashing on
		// the next reconcile. So we give it a plain node React never sees.
		const target = document.createElement("div");
		wrapper.appendChild(target);

		let player: YTPlayer | null = null;
		let cancelled = false;

		loadYouTubeIframeApi().then((YT) => {
			if (cancelled) {
				return;
			}

			player = new YT.Player(target, {
				videoId,
				playerVars: {
					autoplay: autoplay ? 1 : 0,
					controls: 1,
					mute: autoplay ? 1 : 0,
				},
				events: {
					onError: () => onEmbedFailureRef.current(),
					onReady: (event) => {
						// YT.Player defaults the iframe to a fixed 640x390px size,
						// ignoring the wrapper's CSS — force it to fill the wrapper instead.
						const iframe = event.target.getIframe();
						iframe.title = title;
						iframe.classList.add("h-full", "w-full");
					},
				},
			});
		});

		return () => {
			cancelled = true;
			if (player) {
				player.destroy();
			} else {
				target.remove();
			}
		};
	}, [videoId, autoplay, title]);

	return <div className="h-full w-full" ref={wrapperRef} />;
}
