import { cn } from "@GameXL/ui/lib/utils";
import { cva } from "class-variance-authority";

const RATING_OPTIONS = [
	{ value: 0, label: "Any" },
	{ value: 4, label: "4+" },
	{ value: 4.5, label: "4.5+" },
] as const;

const ratingOptionVariants = cva("px-2.5 py-1 text-xs transition-colors", {
	variants: {
		active: {
			true: "bg-accent font-medium",
			false: "text-muted-foreground hover:bg-accent/50",
		},
	},
	defaultVariants: { active: false },
});

export function SearchRatingFilter({
	minRating,
	onChange,
}: {
	minRating: number;
	onChange: (value: number) => void;
}) {
	return (
		<div className="flex overflow-hidden rounded-none border">
			{RATING_OPTIONS.map(({ value, label }) => (
				<button
					aria-pressed={minRating === value}
					className={cn(ratingOptionVariants({ active: minRating === value }))}
					key={value}
					onClick={() => onChange(value)}
					type="button"
				>
					{label}
				</button>
			))}
		</div>
	);
}
