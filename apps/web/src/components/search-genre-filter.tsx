import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@GameXL/ui/components/dropdown-menu";
import { Skeleton } from "@GameXL/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ChevronDownIcon } from "lucide-react";

import { trpcClient } from "@/utils/trpc";

function triggerLabel(selectedGenres: string[]): string {
	if (selectedGenres.length === 0) {
		return "Genre";
	}
	if (selectedGenres.length === 1) {
		return selectedGenres[0];
	}
	return `Genre (${selectedGenres.length})`;
}

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
		return <Skeleton className="h-8 w-24" />;
	}

	if (!genres?.length) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						className="flex h-8 items-center gap-1.5 whitespace-nowrap border border-input px-2.5 text-xs"
						type="button"
					/>
				}
			>
				{triggerLabel(selectedGenres)}
				<ChevronDownIcon className="size-3.5 text-muted-foreground" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="max-h-80 min-w-48">
				{genres.map((genre) => (
					<DropdownMenuCheckboxItem
						checked={selectedGenres.includes(genre)}
						key={genre}
						onCheckedChange={() => onToggle(genre)}
					>
						{genre}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
