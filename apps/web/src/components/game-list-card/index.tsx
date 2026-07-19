import type { GameListSummary } from "@GameXL/api/services/game-list.service";
import { Button } from "@GameXL/ui/components/button";
import { Card, CardHeader, CardTitle } from "@GameXL/ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@GameXL/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	EllipsisIcon,
	GlobeIcon,
	LockIcon,
	PencilIcon,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { DeleteListDialog } from "@/components/delete-list-dialog";
import { ListFormDialog } from "@/components/list-form-dialog";
import { trpcClient } from "@/utils/trpc";

interface GameListCardProps {
	list: GameListSummary;
	readOnly?: boolean;
}

export function GameListCard({ list, readOnly = false }: GameListCardProps) {
	const [isRenameOpen, setIsRenameOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const queryClient = useQueryClient();

	const toggleVisibilityMutation = useMutation({
		mutationFn: () =>
			trpcClient.gameList.update.mutate({
				listId: list.id,
				isPublic: !list.isPublic,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["gameList", "myLists"] });
		},
		onError: () => {
			toast.error("Failed to update list visibility");
		},
	});

	return (
		<>
			<Card className="relative">
				<Link
					aria-label={list.name}
					className="absolute inset-0"
					to={`/lists/${list.id}`}
				/>
				<CardHeader>
					<div className="flex items-start justify-between gap-2">
						<CardTitle>{list.name}</CardTitle>
						{!readOnly && (
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button
											aria-label={`${list.name} options`}
											className="relative z-10"
											size="icon-sm"
											variant="ghost"
										/>
									}
								>
									<EllipsisIcon className="size-4" />
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem onClick={() => setIsRenameOpen(true)}>
										<PencilIcon className="size-4" /> Rename
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => toggleVisibilityMutation.mutate()}
									>
										{list.isPublic ? (
											<>
												<LockIcon className="size-4" /> Make private
											</>
										) : (
											<>
												<GlobeIcon className="size-4" /> Make public
											</>
										)}
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => setIsDeleteOpen(true)}
										variant="destructive"
									>
										<Trash2 className="size-4" /> Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
					<p className="text-muted-foreground text-xs">
						{list.itemCount} {list.itemCount === 1 ? "game" : "games"} ·{" "}
						{list.isPublic ? "Public" : "Private"}
					</p>
				</CardHeader>
			</Card>

			{!readOnly && (
				<>
					<ListFormDialog
						list={list}
						onOpenChange={setIsRenameOpen}
						open={isRenameOpen}
					/>
					<DeleteListDialog
						listId={list.id}
						listName={list.name}
						onOpenChange={setIsDeleteOpen}
						open={isDeleteOpen}
					/>
				</>
			)}
		</>
	);
}
