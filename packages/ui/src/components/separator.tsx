import { cn } from "@GameXL/ui/lib/utils";
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

function Separator({
	className,
	orientation = "horizontal",
	...props
}: SeparatorPrimitive.Props) {
	return (
		<SeparatorPrimitive
			className={cn(
				"shrink-0 bg-border",
				orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
				className
			)}
			data-slot="separator"
			orientation={orientation}
			{...props}
		/>
	);
}

export { Separator };
