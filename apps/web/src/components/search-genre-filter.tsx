import { Skeleton } from "@GameXL/ui/components/skeleton";
import { cn } from "@GameXL/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { cva } from "class-variance-authority";

import { trpcClient } from "@/utils/trpc";

const SKELETON_CHIP_COUNT = 6;

const genreChipVariants = cva(
	"shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors",
	{
		variants: {
			active: {
				true: "border-foreground bg-accent font-medium",
				false: "text-muted-foreground hover:bg-accent/50",
			},
		},
		defaultVariants: { active: false },
	}
);

export function SearchGenreFilter({
	onToggle,
	selectedGenres,
}: {
	onToggle: (genre: string) => void;
	selectedGenres: string[];
}) {
	const { data: genres, status } = useQuery({
		queryKey: ["genres"],
		queryFn: () => trpcClient.search.genres.query(),
		staleTime: Number.POSITIVE_INFINITY,
	});

	if (status === "pending") {
		return (
			<div className="flex flex-wrap items-center gap-1.5">
				{Array.from({ length: SKELETON_CHIP_COUNT }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
					<Skeleton className="h-6 w-16 rounded-full" key={i} />
				))}
			</div>
		);
	}

	if (!genres?.length) {
		return null;
	}

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{genres.map((genre) => (
				<button
					aria-pressed={selectedGenres.includes(genre)}
					className={cn(
						genreChipVariants({ active: selectedGenres.includes(genre) })
					)}
					key={genre}
					onClick={() => onToggle(genre)}
					type="button"
				>
					{genre}
				</button>
			))}
		</div>
	);
}
