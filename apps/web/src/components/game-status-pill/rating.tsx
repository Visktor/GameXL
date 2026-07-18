import { cn } from "@GameXL/ui/lib/utils";
import { StarRating } from "@/components/star-rating";

export function Rating({ score }: { score: number | null }) {
	return (
		<div
			className={cn("flex items-center pr-2", score === null && "opacity-40")}
		>
			<StarRating score={score ?? 0} />
		</div>
	);
}
