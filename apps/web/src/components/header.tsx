import { SearchIcon } from "lucide-react";
import { NavLink } from "react-router";

import { useSearchStore } from "@/stores/search-store";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const links = [{ to: "/", label: "Releases" }] as const;
	const setOpen = useSearchStore((s) => s.setOpen);

	return (
		<div>
			<div className="flex flex-row items-center gap-4 px-2 py-1">
				<nav className="flex shrink-0 gap-4 text-lg">
					{links.map(({ to, label }) => (
						<NavLink
							className={({ isActive }) => (isActive ? "font-bold" : "")}
							end
							key={to}
							to={to}
						>
							{label}
						</NavLink>
					))}
				</nav>
				<button
					aria-label="Search games"
					className="flex h-8 flex-1 items-center gap-2 rounded-none border border-input bg-transparent px-2.5 text-muted-foreground text-xs hover:bg-accent hover:text-accent-foreground"
					onClick={() => setOpen(true)}
					type="button"
				>
					<SearchIcon className="size-4 shrink-0" />
					<span className="flex-1 text-left">Search games...</span>
					<kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded-none border bg-muted px-1.5 font-mono text-[10px]">
						⌘K
					</kbd>
				</button>
				<div className="flex shrink-0 items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	);
}
