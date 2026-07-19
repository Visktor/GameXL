import { cn } from "@GameXL/ui/lib/utils";
import { LayoutGridIcon, ListIcon } from "lucide-react";

import { useViewPreferenceStore } from "@/stores/view-preference-store";

const LAYOUTS = [
	{ icon: LayoutGridIcon, key: "grid", label: "Grid view" },
	{ icon: ListIcon, key: "list", label: "List view" },
] as const;

export function ViewToggle() {
	const layout = useViewPreferenceStore((s) => s.layout);
	const setLayout = useViewPreferenceStore((s) => s.setLayout);

	return (
		<div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-popover p-1.5 shadow-lg">
			{LAYOUTS.map(({ key, icon: Icon, label }) => (
				<button
					aria-label={label}
					aria-pressed={layout === key}
					className={cn(
						"flex size-7 items-center justify-center rounded-full transition-colors",
						layout === key
							? "bg-foreground text-background"
							: "text-muted-foreground hover:bg-muted hover:text-foreground"
					)}
					key={key}
					onClick={() => setLayout(key)}
					type="button"
				>
					<Icon className="size-4" />
				</button>
			))}
		</div>
	);
}
