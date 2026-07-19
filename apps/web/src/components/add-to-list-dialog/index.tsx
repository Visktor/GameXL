import type { GameData } from "@GameXL/api/schemas/user-game.schema";
import { Button } from "@GameXL/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@GameXL/ui/components/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ListFormDialog } from "@/components/list-form-dialog";
import Loader from "@/components/loader";
import { useAddToListStore } from "@/stores/add-to-list-store";
import { trpcClient } from "@/utils/trpc";
import { AddToListRow } from "./list-row";

const EMPTY_LIST_IDS: string[] = [];

interface AddToListDialogProps {
	gameData: GameData;
	onOpenChange: (open: boolean) => void;
	open: boolean;
}

export function AddToListDialog({
	gameData,
	onOpenChange,
	open,
}: AddToListDialogProps) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const queryClient = useQueryClient();

	const addedListIds = useAddToListStore(
		(state) => state.addedListIdsByGame[gameData.igdbId] ?? EMPTY_LIST_IDS
	);
	const markAdded = useAddToListStore((state) => state.markAdded);

	const listsQuery = useQuery({
		queryKey: ["gameList", "myLists"],
		queryFn: () => trpcClient.gameList.myLists.query(),
		enabled: open,
	});

	const addMutation = useMutation({
		mutationFn: (listId: string) =>
			trpcClient.gameList.addGame.mutate({ listId, gameData }),
		onSuccess: (_data, listId) => {
			markAdded(gameData.igdbId, listId);
			queryClient.invalidateQueries({ queryKey: ["gameList", "get", listId] });
		},
		onError: () => {
			toast.error("Failed to add game to list");
		},
	});

	return (
		<>
			<Dialog onOpenChange={onOpenChange} open={open}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add "{gameData.title}" to a list</DialogTitle>
					</DialogHeader>

					{listsQuery.status === "pending" && <Loader />}

					{listsQuery.status === "success" &&
						(listsQuery.data.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								You don't have any lists yet.
							</p>
						) : (
							<ul className="flex flex-col gap-1">
								{listsQuery.data.map((list) => (
									<AddToListRow
										isAdded={addedListIds.includes(list.id)}
										isPending={addMutation.isPending}
										key={list.id}
										list={list}
										onAdd={() => addMutation.mutate(list.id)}
									/>
								))}
							</ul>
						))}

					<Button onClick={() => setIsCreateOpen(true)} variant="secondary">
						New list
					</Button>
				</DialogContent>
			</Dialog>

			<ListFormDialog
				onOpenChange={setIsCreateOpen}
				onSaved={(list) => addMutation.mutate(list.id)}
				open={isCreateOpen}
			/>
		</>
	);
}
