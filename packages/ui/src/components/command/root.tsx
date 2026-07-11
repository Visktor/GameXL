import { cn } from "@GameXL/ui/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import type * as React from "react";

function Command({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			className={cn(
				"flex h-full w-full flex-col overflow-hidden rounded-none bg-popover text-popover-foreground",
				className
			)}
			data-slot="command"
			{...props}
		/>
	);
}

export { Command };
