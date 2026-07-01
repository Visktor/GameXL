import { Star } from "lucide-react";

const STARS = [1, 2, 3, 4, 5];

export function StarRating({ score }: { score: number }) {
	const filled = (score / 100) * 5;

	return (
		<div className="relative flex">
			<div className="flex">
				{STARS.map((i) => (
					<Star className="h-3 w-3 text-muted-foreground/30" key={i} />
				))}
			</div>
			<div
				className="absolute inset-0 flex overflow-hidden"
				style={{ width: `${filled * 7.5}%` }}
			>
				{STARS.map((i) => (
					<Star
						className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400"
						key={i}
					/>
				))}
			</div>
		</div>
	);
}
