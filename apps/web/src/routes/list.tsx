import { useQuery } from "@tanstack/react-query";

import { GameList } from "@/components/game-list";
import Loader from "@/components/loader";
import { toReleaseGame } from "@/utils/tracked-game";
import { trpcClient } from "@/utils/trpc";

export default function MyList() {
	const { data, status } = useQuery({
		queryKey: ["userGame", "myList"],
		queryFn: () => trpcClient.userGame.myList.query(),
	});

	if (status === "pending") {
		return <Loader />;
	}

	if (status === "error") {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">
					Failed to load your list. Please try again.
				</p>
			</div>
		);
	}

	return (
		<main className="@container h-full overflow-y-auto p-4">
			<div className="mx-auto flex max-w-6xl flex-col gap-4">
				<h1 className="font-semibold text-2xl">My List</h1>
				<GameList games={data.map(toReleaseGame)} />
			</div>
		</main>
	);
}
