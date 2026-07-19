import type { ComponentProps } from "react";
import { StatusQuickAdd } from "@/components/status-quick-add";

export function QuickAdd(props: ComponentProps<typeof StatusQuickAdd>) {
	return (
		<div className="flex shrink-0 items-center pl-2">
			<StatusQuickAdd {...props} />
		</div>
	);
}
