import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
	return (
		<p className="py-12 text-center text-muted-foreground text-sm">
			{children}
		</p>
	);
}
