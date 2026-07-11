import { cn } from "@GameXL/ui/lib/utils";
import { CommandGroup as CommandGroupPrimitive } from "cmdk";
import type * as React from "react";

function CommandGroup({
	className,
	...props
}: React.ComponentProps<typeof CommandGroupPrimitive>) {
	return (
		<CommandGroupPrimitive
			className={cn(
				"overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs",
				className
			)}
			data-slot="command-group"
			{...props}
		/>
	);
}

export { CommandGroup };
