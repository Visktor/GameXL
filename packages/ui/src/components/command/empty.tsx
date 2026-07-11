import { CommandEmpty as CommandEmptyPrimitive } from "cmdk";
import type * as React from "react";

function CommandEmpty(
	props: React.ComponentProps<typeof CommandEmptyPrimitive>
) {
	return (
		<CommandEmptyPrimitive
			className="py-6 text-center text-muted-foreground text-xs"
			data-slot="command-empty"
			{...props}
		/>
	);
}

export { CommandEmpty };
