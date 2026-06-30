import { Input } from "@GameXL/ui/components/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const links = [{ to: "/", label: "Releases" }] as const;
	const navigate = useNavigate();
	const [query, setQuery] = useState("");

	function handleSearch(e: React.FormEvent) {
		e.preventDefault();
		if (query.trim()) {
			navigate(`/search?q=${encodeURIComponent(query.trim())}`);
		}
	}

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
				<form className="relative flex-1" onSubmit={handleSearch}>
					<Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						className="pl-8"
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search games..."
						value={query}
					/>
				</form>
				<div className="flex shrink-0 items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	);
}
