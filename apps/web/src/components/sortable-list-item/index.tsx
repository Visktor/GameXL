import { Button } from "@GameXL/ui/components/button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GripVerticalIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { GameCard, type ReleaseGame } from "@/components/game-card";
import { trpcClient } from "@/utils/trpc";

interface SortableListItemProps {
	game: ReleaseGame;
	isOwner: boolean;
	listId: string;
}

export function SortableListItem({
	game,
	isOwner,
	listId,
}: SortableListItemProps) {
	const queryClient = useQueryClient();
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: game.igdbId, disabled: !isOwner });

	const removeMutation = useMutation({
		mutationFn: () =>
			trpcClient.gameList.removeGame.mutate({ listId, igdbId: game.igdbId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["gameList", "get", listId] });
		},
		onError: () => {
			toast.error("Failed to remove game from list");
		},
	});

	return (
		<div
			className="relative"
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.5 : 1,
			}}
		>
			{isOwner && (
				<div className="absolute inset-x-0 top-0 z-[60] flex justify-between p-1">
					<Button
						aria-label="Drag to reorder"
						className="cursor-grab touch-none active:cursor-grabbing"
						size="icon-xs"
						variant="secondary"
						{...attributes}
						{...listeners}
					>
						<GripVerticalIcon className="size-3" />
					</Button>
					<Button
						aria-label="Remove from list"
						disabled={removeMutation.isPending}
						onClick={() => removeMutation.mutate()}
						size="icon-xs"
						variant="secondary"
					>
						<XIcon className="size-3" />
					</Button>
				</div>
			)}
			<GameCard game={game} />
		</div>
	);
}
