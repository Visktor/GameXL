import { useQuery } from "@tanstack/react-query";

import { GameList } from "@/components/game-list";
import Loader from "@/components/loader";
import { toReleaseGame } from "@/utils/tracked-game";
import { trpcClient } from "@/utils/trpc";

export default function Tracked() {
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
		<main className="@container flex h-full flex-col overflow-hidden p-4">
			<div className="mx-auto w-full max-w-6xl shrink-0 pb-4">
				<h1 className="font-semibold text-2xl">Tracked</h1>
			</div>
			<div className="mx-auto w-full max-w-6xl flex-1 overflow-hidden">
				<GameList games={data.map(toReleaseGame)} />
			</div>
		</main>
	);
}
