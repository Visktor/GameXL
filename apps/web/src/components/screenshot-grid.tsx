import {
	IGDB_SCREENSHOT_THUMBNAIL_HEIGHT,
	IGDB_SCREENSHOT_THUMBNAIL_WIDTH,
} from "@/constants/igdb";

interface ScreenshotGridProps {
	onSelect: (index: number) => void;
	screenshots: string[];
	title: string;
}

export function ScreenshotGrid({
	onSelect,
	screenshots,
	title,
}: ScreenshotGridProps) {
	if (screenshots.length === 0) {
		return null;
	}

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{screenshots.map((url, i) => (
				<button
					aria-label={`Expand screenshot ${i + 1}`}
					className="aspect-video cursor-pointer overflow-hidden rounded-sm bg-muted transition-opacity hover:opacity-90"
					key={url}
					onClick={() => onSelect(i)}
					type="button"
				>
					<img
						alt={`${title} screenshot ${i + 1}`}
						className="h-full w-full object-cover"
						height={IGDB_SCREENSHOT_THUMBNAIL_HEIGHT}
						src={url}
						width={IGDB_SCREENSHOT_THUMBNAIL_WIDTH}
					/>
				</button>
			))}
		</div>
	);
}
