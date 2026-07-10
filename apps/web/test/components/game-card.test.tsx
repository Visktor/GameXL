import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { cloneElement, type ReactElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { GameCard, type ReleaseGame } from "@/components/game-card";

vi.mock("@GameXL/ui/components/hover-card", () => ({
	HoverCard: ({ children }: { children: ReactNode }) => <>{children}</>,
	HoverCardTrigger: ({
		children,
		render,
	}: {
		children: ReactNode;
		render: ReactElement;
	}) => cloneElement(render, undefined, children),
	HoverCardContent: () => null,
}));

function renderGameCard(game: ReleaseGame): ReturnType<typeof render> {
	const queryClient = new QueryClient();
	const wrapped: ReactElement = (
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<GameCard game={game} />
			</MemoryRouter>
		</QueryClientProvider>
	);
	return render(wrapped);
}

const baseGame: ReleaseGame = {
	igdbId: "1",
	title: "Hollow Knight",
	coverUrl: null,
	trailerVideoId: null,
	releaseDate: null,
	igdbScore: null,
	trackedStatus: null,
};

describe("GameCard", () => {
	it("falls back to the title as text when there is no cover", () => {
		renderGameCard(baseGame);

		expect(screen.getAllByText("Hollow Knight")).toHaveLength(2);
		expect(screen.queryByRole("img")).not.toBeInTheDocument();
	});

	it("renders the cover image when a coverUrl is present", () => {
		renderGameCard({ ...baseGame, coverUrl: "https://example.com/cover.jpg" });

		expect(screen.getByAltText("Hollow Knight")).toHaveAttribute(
			"src",
			"https://example.com/cover.jpg"
		);
	});

	it("hides the star rating when igdbScore is null", () => {
		const { container } = renderGameCard(baseGame);

		expect(container.querySelector("svg")).not.toBeInTheDocument();
	});

	it("shows a star rating when igdbScore is present", () => {
		const { container } = renderGameCard({ ...baseGame, igdbScore: 87 });

		expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
	});
});
