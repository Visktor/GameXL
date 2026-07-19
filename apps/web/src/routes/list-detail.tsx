import { Button } from "@GameXL/ui/components/button";
import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
} from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { GlobeIcon, LockIcon, PencilIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { DeleteListDialog } from "@/components/delete-list-dialog";
import { ListFormDialog } from "@/components/list-form-dialog";
import Loader from "@/components/loader";
import { SortableListItem } from "@/components/sortable-list-item";
import { GAME_GRID_CLASSNAME } from "@/constants/game-grid";
import { NotFoundError } from "@/utils/errors";
import { listItemToReleaseGame } from "@/utils/game-list-item";
import { trpcClient } from "@/utils/trpc";

export default function ListDetail() {
	const { listId } = useParams<{ listId: string }>();
	const navigate = useNavigate();
	const [isRenameOpen, setIsRenameOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const queryClient = useQueryClient();
	const sensors = useSensors(useSensor(PointerSensor));

	if (!listId) {
		throw new NotFoundError("Missing list route param");
	}

	const listQuery = useQuery({
		queryKey: ["gameList", "get", listId],
		queryFn: () => trpcClient.gameList.get.query({ listId }),
	});

	const toggleVisibilityMutation = useMutation({
		mutationFn: () =>
			trpcClient.gameList.update.mutate({
				listId,
				isPublic: !listQuery.data?.isPublic,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["gameList", "get", listId] });
			queryClient.invalidateQueries({ queryKey: ["gameList", "myLists"] });
		},
		onError: () => {
			toast.error("Failed to update list visibility");
		},
	});

	const reorderMutation = useMutation({
		mutationFn: (orderedIgdbIds: string[]) =>
			trpcClient.gameList.reorder.mutate({ listId, orderedIgdbIds }),
		onError: () => {
			toast.error("Failed to save new order");
			queryClient.invalidateQueries({ queryKey: ["gameList", "get", listId] });
		},
	});

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!(over && listQuery.data) || active.id === over.id) {
			return;
		}

		const items = listQuery.data.items;
		const oldIndex = items.findIndex((item) => item.igdbId === active.id);
		const newIndex = items.findIndex((item) => item.igdbId === over.id);
		const newItems = arrayMove(items, oldIndex, newIndex);

		queryClient.setQueryData(["gameList", "get", listId], {
			...listQuery.data,
			items: newItems,
		});
		reorderMutation.mutate(newItems.map((item) => item.igdbId));
	};

	if (listQuery.status === "pending") {
		return <Loader />;
	}

	if (listQuery.status === "error") {
		if (
			listQuery.error instanceof TRPCClientError &&
			listQuery.error.data?.code === "NOT_FOUND"
		) {
			throw new NotFoundError("List not found");
		}
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">
					Failed to load this list. Please try again.
				</p>
			</div>
		);
	}

	const list = listQuery.data;

	return (
		<main className="h-full overflow-y-auto p-4">
			<div className="mx-auto flex max-w-6xl flex-col gap-4">
				<div className="flex items-center justify-between gap-2">
					<div>
						<Link
							className="text-muted-foreground text-sm hover:underline"
							to="/lists"
						>
							← My Lists
						</Link>
						<h1 className="font-semibold text-2xl">{list.name}</h1>
						<p className="text-muted-foreground text-sm">
							{list.itemCount} {list.itemCount === 1 ? "game" : "games"} ·{" "}
							{list.isPublic ? "Public" : "Private"}
						</p>
					</div>

					{list.isOwner && (
						<div className="flex items-center gap-1.5">
							<Button onClick={() => setIsRenameOpen(true)} variant="ghost">
								<PencilIcon className="h-4 w-4" /> Rename
							</Button>
							<Button
								onClick={() => toggleVisibilityMutation.mutate()}
								variant="ghost"
							>
								{list.isPublic ? (
									<>
										<LockIcon className="h-4 w-4" /> Make private
									</>
								) : (
									<>
										<GlobeIcon className="h-4 w-4" /> Make public
									</>
								)}
							</Button>
							<Button onClick={() => setIsDeleteOpen(true)} variant="ghost">
								<Trash2 className="h-4 w-4" /> Delete
							</Button>
						</div>
					)}
				</div>

				{list.items.length === 0 ? (
					<p className="py-12 text-center text-muted-foreground text-sm">
						Nothing here yet.
					</p>
				) : (
					<DndContext
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
						sensors={sensors}
					>
						<SortableContext
							items={list.items.map((item) => item.igdbId)}
							strategy={rectSortingStrategy}
						>
							<div className={GAME_GRID_CLASSNAME}>
								{list.items.map((item) => (
									<SortableListItem
										game={listItemToReleaseGame(item)}
										isOwner={list.isOwner}
										key={item.igdbId}
										listId={listId}
									/>
								))}
							</div>
						</SortableContext>
					</DndContext>
				)}
			</div>

			{list.isOwner && (
				<>
					<ListFormDialog
						list={list}
						onOpenChange={setIsRenameOpen}
						open={isRenameOpen}
					/>
					<DeleteListDialog
						listId={list.id}
						listName={list.name}
						onDeleted={() => navigate("/lists")}
						onOpenChange={setIsDeleteOpen}
						open={isDeleteOpen}
					/>
				</>
			)}
		</main>
	);
}
