import {
	Dialog,
	DialogClose,
	DialogContent,
} from "@GameXL/ui/components/dialog";
import { ChevronLeft, ChevronRight, XIcon } from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

const NAV_BUTTON_CLASSNAME =
	"-translate-y-1/2 absolute top-1/2 rounded-full bg-background/80 p-2 text-foreground opacity-90 outline-hidden transition-opacity hover:opacity-100";

interface ImageLightboxProps {
	image?: { alt: string; url: string };
	imageCount: number;
	onNavigate: (direction: -1 | 1) => void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
}

export function ImageLightbox({
	image,
	imageCount,
	onNavigate,
	onOpenChange,
	open,
}: ImageLightboxProps) {
	const canNavigate = imageCount > 1;

	const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
		if (!canNavigate) {
			return;
		}

		if (event.key === "ArrowLeft") {
			onNavigate(-1);
		} else if (event.key === "ArrowRight") {
			onNavigate(1);
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className="inset-0 flex h-full max-w-none translate-x-0 translate-y-0 items-center justify-center border-none bg-transparent p-0 shadow-none ring-0"
				onKeyDown={handleKeyDown}
				showCloseButton={false}
			>
				{image && (
					<>
						{/* biome-ignore lint/correctness/useImageSize: dimensions vary per screenshot and aren't known before load; rendered inside a fixed overlay, so no layout shift occurs */}
						<img
							alt={image.alt}
							className="max-h-[85vh] max-w-[95vw] rounded-sm"
							src={image.url}
						/>
						<DialogClose
							aria-label="Close"
							className="absolute top-4 right-4 rounded-full bg-background/80 p-2 text-foreground opacity-90 outline-hidden transition-opacity hover:opacity-100"
						>
							<XIcon className="h-4 w-4" />
						</DialogClose>
						{canNavigate && (
							<>
								<button
									aria-label="Previous image"
									className={`${NAV_BUTTON_CLASSNAME} left-4`}
									onClick={() => onNavigate(-1)}
									type="button"
								>
									<ChevronLeft className="h-4 w-4" />
								</button>
								<button
									aria-label="Next image"
									className={`${NAV_BUTTON_CLASSNAME} right-4`}
									onClick={() => onNavigate(1)}
									type="button"
								>
									<ChevronRight className="h-4 w-4" />
								</button>
							</>
						)}
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
