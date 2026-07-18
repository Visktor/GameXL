import { Button } from "@GameXL/ui/components/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router";

import { useGamePreviewPanelStore } from "@/stores/game-preview-panel-store";
import { GamePreviewPanelContent } from "./game-preview-panel-content";

export function GamePreviewPanel() {
	const selectedGameId = useGamePreviewPanelStore((s) => s.selectedGameId);
	const close = useGamePreviewPanelStore((s) => s.close);
	const location = useLocation();

	useEffect(() => {
		if (!selectedGameId) {
			return;
		}
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				close();
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [selectedGameId, close]);

	useEffect(() => {
		if (selectedGameId && location.pathname.startsWith("/games/")) {
			close();
		}
	}, [selectedGameId, location.pathname, close]);

	if (!selectedGameId) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-background lg:static lg:z-auto lg:w-120 lg:shrink-0 lg:border-l">
			<div className="flex shrink-0 items-center justify-between border-b p-3">
				<Button onClick={close} size="sm" variant="ghost">
					<ArrowLeft className="h-4 w-4" />
					Back
				</Button>
				<Link
					className="flex items-center gap-1.5 text-muted-foreground text-xs hover:text-foreground"
					to={`/games/${selectedGameId}`}
				>
					Full page
					<ExternalLink className="h-3.5 w-3.5" />
				</Link>
			</div>
			<GamePreviewPanelContent igdbId={selectedGameId} />
		</div>
	);
}
