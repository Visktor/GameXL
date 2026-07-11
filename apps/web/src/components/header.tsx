import { SearchIcon } from "lucide-react";
import { NavLink } from "react-router";

import { useSearchStore } from "@/stores/search-store";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const links = [{ to: "/", label: "Releases" }] as const;
	const setOpen = useSearchStore((s) => s.setOpen);

	return (
		<div className="border-border border-b">
			<div className="flex h-14 flex-row items-center gap-4 px-4">
				<nav className="flex shrink-0 items-center gap-4 font-bold text-lg">
					{links.map(({ to, label }) => (
						<NavLink
							className={({ isActive }) =>
								isActive ? "" : "text-muted-foreground"
							}
							end
							key={to}
							to={to}
						>
							{label}
						</NavLink>
					))}
				</nav>
				<div className="flex flex-1 justify-center">
					<button
						aria-label="Search games"
						className="flex h-9 w-full max-w-md items-center gap-2 rounded-full border border-input bg-muted/40 px-4 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
						onClick={() => setOpen(true)}
						type="button"
					>
						<SearchIcon className="size-4 shrink-0" />
						<span className="flex-1 text-left">Search games...</span>
						<kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded-full border bg-background px-2 font-mono text-[10px]">
							⌘K
						</kbd>
					</button>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</div>
	);
}
