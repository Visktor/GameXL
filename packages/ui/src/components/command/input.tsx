import { cn } from "@GameXL/ui/lib/utils";
import { CommandInput as CommandInputPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import type * as React from "react";

function CommandInput({
	className,
	...props
}: React.ComponentProps<typeof CommandInputPrimitive>) {
	return (
		<div
			className="flex h-8 items-center gap-2 rounded-none border border-input bg-transparent px-2.5 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50"
			data-slot="command-input-wrapper"
		>
			<SearchIcon className="size-4 shrink-0 text-muted-foreground" />
			<CommandInputPrimitive
				className={cn(
					"flex h-8 w-full rounded-none bg-transparent py-1 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
					className
				)}
				data-slot="command-input"
				{...props}
			/>
		</div>
	);
}

export { CommandInput };
