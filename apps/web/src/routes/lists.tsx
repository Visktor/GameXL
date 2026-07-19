import { Button } from "@GameXL/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { Link, Outlet } from "react-router";

import { EmptyState } from "@/components/empty-state";
import { GameListCard } from "@/components/game-list-card";
import Loader from "@/components/loader";
import { trpcClient } from "@/utils/trpc";

export default function Lists() {
	const { data, status } = useQuery({
		queryKey: ["gameList", "myLists"],
		queryFn: () => trpcClient.gameList.myLists.query(),
	});

	if (status === "pending") {
		return <Loader />;
	}

	if (status === "error") {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">
					Failed to load your lists. Please try again.
				</p>
			</div>
		);
	}

	return (
		<main className="h-full overflow-y-auto p-4">
			<div className="mx-auto flex max-w-6xl flex-col gap-4">
				<div className="flex items-center justify-between">
					<h1 className="font-semibold text-2xl">My Lists</h1>
					<Button render={<Link to="new" />}>
						<PlusIcon className="h-4 w-4" /> New list
					</Button>
				</div>

				{data.length === 0 ? (
					<EmptyState>Nothing here yet.</EmptyState>
				) : (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
						{data.map((list) => (
							<GameListCard key={list.id} list={list} />
						))}
					</div>
				)}
			</div>

			<Outlet />
		</main>
	);
}
