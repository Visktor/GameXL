import { Button } from "@GameXL/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@GameXL/ui/components/dialog";
import { Input } from "@GameXL/ui/components/input";
import { Label } from "@GameXL/ui/components/label";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

interface UsernameDialogProps {
	currentUsername: string | null;
	onOpenChange: (open: boolean) => void;
	open: boolean;
}

export function UsernameDialog({
	currentUsername,
	onOpenChange,
	open,
}: UsernameDialogProps) {
	const [value, setValue] = useState(currentUsername ?? "");
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		const username = value.trim().toLowerCase();
		if (!username) {
			return;
		}

		setIsSaving(true);
		await authClient.updateUser({
			username,
			fetchOptions: {
				onSuccess: () => {
					toast.success("Username updated");
					onOpenChange(false);
				},
				onError: (ctx: { error: { message?: string } }) => {
					toast.error(ctx.error.message || "That username is taken");
				},
			},
		});
		setIsSaving(false);
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Set your username</DialogTitle>
					<DialogDescription>
						Your username becomes your public profile link: /u/
						{value || "username"}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<Label htmlFor="username">Username</Label>
					<Input
						id="username"
						onChange={(e) => setValue(e.target.value)}
						placeholder="username"
						value={value}
					/>
				</div>
				<Button disabled={isSaving || !value.trim()} onClick={handleSave}>
					Save
				</Button>
			</DialogContent>
		</Dialog>
	);
}
