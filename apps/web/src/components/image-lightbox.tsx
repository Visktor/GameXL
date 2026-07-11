import {
	Dialog,
	DialogClose,
	DialogContent,
} from "@GameXL/ui/components/dialog";
import { XIcon } from "lucide-react";

interface ImageLightboxProps {
	image?: { url: string; alt: string };
	onOpenChange: (open: boolean) => void;
	open: boolean;
}

export function ImageLightbox({
	image,
	onOpenChange,
	open,
}: ImageLightboxProps) {
	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className="max-w-4xl border-none bg-transparent p-0 shadow-none ring-0"
				showCloseButton={false}
			>
				{image && (
					<>
						<img
							alt={image.alt}
							className="max-h-[85vh] w-full rounded-sm object-contain"
							height={720}
							src={image.url}
							width={1280}
						/>
						<DialogClose
							aria-label="Close"
							className="absolute top-4 right-4 rounded-full bg-background/80 p-2 text-foreground opacity-90 outline-hidden transition-opacity hover:opacity-100"
						>
							<XIcon className="h-4 w-4" />
						</DialogClose>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
