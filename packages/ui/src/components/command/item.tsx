import { cn } from "@GameXL/ui/lib/utils";
import { CommandItem as CommandItemPrimitive } from "cmdk";
import type * as React from "react";

function CommandItem({
	className,
	...props
}: React.ComponentProps<typeof CommandItemPrimitive>) {
	return (
		<CommandItemPrimitive
			className={cn(
				"relative flex cursor-default select-none items-center gap-2 rounded-none px-2 py-2 text-xs outline-hidden data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className
			)}
			data-slot="command-item"
			{...props}
		/>
	);
}

export { CommandItem };
