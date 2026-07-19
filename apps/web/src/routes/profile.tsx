import { useQuery } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { useParams } from "react-router";

import { GameList } from "@/components/game-list";
import Loader from "@/components/loader";
import { authClient } from "@/lib/auth-client";
import { NotFoundError } from "@/utils/errors";
import { toReleaseGame } from "@/utils/tracked-game";
import { trpcClient } from "@/utils/trpc";

export default function Profile() {
	const { username } = useParams<{ username: string }>();
	const { data: session } = authClient.useSession();

	const profileQuery = useQuery({
		queryKey: ["user", "getByUsername", username],
		queryFn: () =>
			trpcClient.user.getByUsername.query({ username: username ?? "" }),
		enabled: Boolean(username),
	});

	const gamesQuery = useQuery({
		queryKey: ["userGame", "listByUsername", username],
		queryFn: () =>
			trpcClient.userGame.listByUsername.query({ username: username ?? "" }),
		enabled: Boolean(username),
	});

	if (!username) {
		throw new NotFoundError("Missing username route param");
	}

	if (profileQuery.status === "pending" || gamesQuery.status === "pending") {
		return <Loader />;
	}

	if (profileQuery.status === "error") {
		if (
			profileQuery.error instanceof TRPCClientError &&
			profileQuery.error.data?.code === "NOT_FOUND"
		) {
			throw new NotFoundError("User not found");
		}
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">
					Failed to load profile. Please try again.
				</p>
			</div>
		);
	}

	if (gamesQuery.status === "error") {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">
					Failed to load list. Please try again.
				</p>
			</div>
		);
	}

	const profile = profileQuery.data;
	const isOwnProfile = session?.user.username === username;

	return (
		<main className="@container flex h-full flex-col overflow-hidden p-4">
			<div className="mx-auto w-full max-w-6xl shrink-0 pb-6">
				<div className="flex items-center gap-4">
					{profile.image ? (
						<img
							alt={profile.name}
							className="h-16 w-16 rounded-full object-cover"
							height={64}
							src={profile.image}
							width={64}
						/>
					) : (
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg">
							{profile.name.charAt(0).toUpperCase()}
						</div>
					)}
					<div>
						<h1 className="font-semibold text-2xl">
							{profile.displayUsername ?? profile.username}
						</h1>
						<p className="text-muted-foreground text-sm">
							Joined {new Date(profile.createdAt).toLocaleDateString()}
						</p>
					</div>
				</div>
			</div>

			<div className="mx-auto w-full max-w-6xl flex-1 overflow-hidden">
				<GameList
					games={gamesQuery.data.map(toReleaseGame)}
					readOnly={!isOwnProfile}
				/>
			</div>
		</main>
	);
}
