import { Button } from "@GameXL/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@GameXL/ui/components/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { trpcClient } from "@/utils/trpc";

interface DeleteListDialogProps {
	listId: string;
	listName: string;
	onDeleted?: () => void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
}

export function DeleteListDialog({
	listId,
	listName,
	onDeleted,
	onOpenChange,
	open,
}: DeleteListDialogProps) {
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: () => trpcClient.gameList.remove.mutate({ listId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["gameList", "myLists"] });
			onOpenChange(false);
			onDeleted?.();
		},
		onError: () => {
			toast.error("Failed to delete list");
		},
	});

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete "{listName}"?</DialogTitle>
					<DialogDescription>
						This removes the list and all of its games. This can't be undone.
					</DialogDescription>
				</DialogHeader>
				<div className="flex justify-end gap-2">
					<Button onClick={() => onOpenChange(false)} variant="secondary">
						Cancel
					</Button>
					<Button
						disabled={deleteMutation.isPending}
						onClick={() => deleteMutation.mutate()}
						variant="destructive"
					>
						Delete
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
