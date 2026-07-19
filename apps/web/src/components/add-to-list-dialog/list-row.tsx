import type { GameListSummary } from "@GameXL/api/services/game-list.service";
import { Button } from "@GameXL/ui/components/button";
import { CheckIcon, PlusIcon } from "lucide-react";

interface AddToListRowProps {
	isAdded: boolean;
	isPending: boolean;
	list: GameListSummary;
	onAdd: () => void;
}

export function AddToListRow({
	isAdded,
	isPending,
	list,
	onAdd,
}: AddToListRowProps) {
	return (
		<li className="flex items-center justify-between gap-2 py-1">
			<span className="text-sm">
				{list.name}{" "}
				<span className="text-muted-foreground">({list.itemCount})</span>
			</span>
			<Button
				disabled={isAdded || isPending}
				onClick={onAdd}
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
}
