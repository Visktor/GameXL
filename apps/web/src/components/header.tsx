import { NavLink } from "react-router";

import HeaderSearch from "./header-search";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const links = [{ to: "/", label: "Releases" }] as const;

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
				<HeaderSearch />
				<div className="flex shrink-0 items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	);
}
