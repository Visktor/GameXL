import { cn } from "@GameXL/ui/lib/utils";
import { BookmarkIcon, HomeIcon, SearchIcon } from "lucide-react";
import { NavLink } from "react-router";

import { AutoplayToggle } from "./autoplay-toggle";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const NAV_ITEMS = [
	{ to: "/", label: "Releases", icon: HomeIcon },
	{ to: "/list", label: "My List", icon: BookmarkIcon },
	{ to: "/search", label: "Search", icon: SearchIcon },
] as const;

function NavPillItem({
	to,
	label,
	icon: Icon,
}: {
	to: string;
	label: string;
	icon: typeof HomeIcon;
}) {
	return (
		<NavLink
			className={({ isActive }) =>
				cn(
					"flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm transition-colors",
					isActive
						? "bg-foreground font-medium text-background"
						: "w-9 justify-center px-0 text-muted-foreground hover:bg-muted hover:text-foreground"
				)
			}
			end
			to={to}
		>
			{({ isActive }) => (
				<>
					<Icon className="size-4 shrink-0" />
					{isActive && <span>{label}</span>}
				</>
			)}
		</NavLink>
	);
}

export default function Header() {
	return (
		<header className="flex items-center justify-between gap-3 px-4 py-3">
			<nav className="flex items-center gap-1 rounded-full border border-border bg-popover p-1.5 shadow-lg">
				{NAV_ITEMS.map((item) => (
					<NavPillItem key={item.to} {...item} />
				))}
			</nav>
			<div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-popover p-1.5 shadow-lg">
				<ModeToggle />
				<AutoplayToggle />
				<UserMenu />
			</div>
		</header>
	);
}
