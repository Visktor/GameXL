import { cn } from "@GameXL/ui/lib/utils";
import { CommandList as CommandListPrimitive } from "cmdk";
import type * as React from "react";

function CommandList({
	className,
	...props
}: React.ComponentProps<typeof CommandListPrimitive>) {
	return (
		<CommandListPrimitive
			className={cn(
				"max-h-80 scroll-py-1 overflow-y-auto overflow-x-hidden",
				className
			)}
			data-slot="command-list"
			{...props}
		/>
	);
}

export { CommandList };
