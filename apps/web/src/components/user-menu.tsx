import { Button } from "@GameXL/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@GameXL/ui/components/dropdown-menu";
import { Skeleton } from "@GameXL/ui/components/skeleton";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { UsernameDialog } from "@/components/username-dialog";
import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();
	const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Link to="/login">
				<Button className="rounded-full" variant="ghost">
					Sign In
				</Button>
			</Link>
		);
	}

	const { username } = session.user;

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={<Button className="rounded-full" variant="ghost" />}
				>
					{session.user.name}
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="min-w-48 rounded-2xl bg-card p-1 shadow-lg"
				>
					<DropdownMenuGroup>
						<DropdownMenuLabel>My Account</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem className="rounded-lg">
							{session.user.email}
						</DropdownMenuItem>
						<DropdownMenuItem
							className="rounded-lg"
							render={<Link to="/tracked" />}
						>
							Tracked
						</DropdownMenuItem>
						{username && (
							<DropdownMenuItem
								className="rounded-lg"
								render={<Link to={`/u/${username}`} />}
							>
								My Profile
							</DropdownMenuItem>
						)}
						<DropdownMenuItem
							className="rounded-lg"
							onClick={() => setUsernameDialogOpen(true)}
						>
							{username ? "Change Username" : "Set Username"}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="rounded-lg"
							onClick={() => {
								authClient.signOut({
									fetchOptions: {
										onSuccess: () => {
											navigate("/");
										},
									},
								});
							}}
							variant="destructive"
						>
							Sign Out
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<UsernameDialog
				currentUsername={username ?? null}
				onOpenChange={setUsernameDialogOpen}
				open={usernameDialogOpen}
			/>
		</>
	);
}
