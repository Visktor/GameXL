import type { GameListSummary } from "@GameXL/api/services/game-list.service";
import { Button } from "@GameXL/ui/components/button";
import { Checkbox } from "@GameXL/ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@GameXL/ui/components/dialog";
import { Input } from "@GameXL/ui/components/input";
import { Label } from "@GameXL/ui/components/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { trpcClient } from "@/utils/trpc";

interface ListFormDialogProps {
	/** Present in edit mode (rename/visibility); omitted when creating a new list. */
	list?: GameListSummary;
	onOpenChange: (open: boolean) => void;
	onSaved?: (list: GameListSummary) => void;
	open: boolean;
}

export function ListFormDialog({
	list,
	onOpenChange,
	onSaved,
	open,
}: ListFormDialogProps) {
	const [name, setName] = useState(list?.name ?? "");
	const [isPublic, setIsPublic] = useState(list?.isPublic ?? false);
	const queryClient = useQueryClient();

	useEffect(() => {
		if (open) {
			setName(list?.name ?? "");
			setIsPublic(list?.isPublic ?? false);
		}
	}, [open, list]);

	const saveMutation = useMutation({
		mutationFn: () =>
			list
				? trpcClient.gameList.update.mutate({
						listId: list.id,
						name: name.trim(),
						isPublic,
					})
				: trpcClient.gameList.create.mutate({ name: name.trim(), isPublic }),
		onSuccess: (savedList) => {
			queryClient.invalidateQueries({ queryKey: ["gameList", "myLists"] });
			if (list) {
				queryClient.invalidateQueries({
					queryKey: ["gameList", "get", list.id],
				});
			}
			onOpenChange(false);
			onSaved?.(savedList);
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to save list"
			);
		},
	});

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{list ? "Rename list" : "New list"}</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<Label htmlFor="list-name">Name</Label>
					<Input
						autoFocus
						id="list-name"
						onChange={(e) => setName(e.target.value)}
						placeholder="Best RPGs"
						value={name}
					/>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox
						checked={isPublic}
						id="list-public"
						onCheckedChange={(checked) => setIsPublic(checked === true)}
					/>
					<Label htmlFor="list-public">Make this list public</Label>
				</div>
				<Button
					disabled={saveMutation.isPending || !name.trim()}
					onClick={() => saveMutation.mutate()}
				>
					{list ? "Save" : "Create"}
				</Button>
			</DialogContent>
		</Dialog>
	);
}
