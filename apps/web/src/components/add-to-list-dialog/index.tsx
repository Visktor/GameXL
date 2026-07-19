import type { GameData } from "@GameXL/api/schemas/user-game.schema";
import { Button } from "@GameXL/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@GameXL/ui/components/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ListFormDialog } from "@/components/list-form-dialog";
import Loader from "@/components/loader";
import { trpcClient } from "@/utils/trpc";

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
	const [addedListIds, setAddedListIds] = useState<Set<string>>(new Set());
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const queryClient = useQueryClient();

	const listsQuery = useQuery({
		queryKey: ["gameList", "myLists"],
		queryFn: () => trpcClient.gameList.myLists.query(),
		enabled: open,
	});

	const addMutation = useMutation({
		mutationFn: (listId: string) =>
			trpcClient.gameList.addGame.mutate({ listId, gameData }),
		onSuccess: (_data, listId) => {
			setAddedListIds((prev) => new Set(prev).add(listId));
			queryClient.invalidateQueries({ queryKey: ["gameList", "get", listId] });
		},
		onError: () => {
			toast.error("Failed to add game to list");
		},
	});

	return (
		<>
			<Dialog
				onOpenChange={(next) => {
					if (!next) {
						setAddedListIds(new Set());
					}
					onOpenChange(next);
				}}
				open={open}
			>
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
								{listsQuery.data.map((list) => {
									const isAdded = addedListIds.has(list.id);
									return (
										<li
											className="flex items-center justify-between gap-2 py-1"
											key={list.id}
										>
											<span className="text-sm">
												{list.name}{" "}
												<span className="text-muted-foreground">
													({list.itemCount})
												</span>
											</span>
											<Button
												disabled={isAdded || addMutation.isPending}
												onClick={() => addMutation.mutate(list.id)}
												size="sm"
												variant={isAdded ? "ghost" : "outline"}
											>
												{isAdded ? (
													<>
														<CheckIcon className="size-4" /> Added
													</>
												) : (
													<>
														<PlusIcon className="size-4" /> Add
													</>
												)}
											</Button>
										</li>
									);
								})}
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
