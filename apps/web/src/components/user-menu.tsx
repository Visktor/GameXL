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
				<Button variant="outline">Sign In</Button>
			</Link>
		);
	}

	const { username } = session.user;

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger render={<Button variant="outline" />}>
					{session.user.name}
				</DropdownMenuTrigger>
				<DropdownMenuContent className="bg-card">
					<DropdownMenuGroup>
						<DropdownMenuLabel>My Account</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem>{session.user.email}</DropdownMenuItem>
						<DropdownMenuItem render={<Link to="/list" />}>
							My List
						</DropdownMenuItem>
						{username && (
							<DropdownMenuItem render={<Link to={`/u/${username}`} />}>
								My Profile
							</DropdownMenuItem>
						)}
						<DropdownMenuItem onClick={() => setUsernameDialogOpen(true)}>
							{username ? "Change Username" : "Set Username"}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
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
