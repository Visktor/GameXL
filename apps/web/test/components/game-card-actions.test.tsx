import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { cloneElement, type ReactElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { GameCard, type ReleaseGame } from "@/components/game-card";
import { server } from "../support/msw-server";
import { mockTrpcMutation } from "../support/trpc-msw";

vi.mock("@GameXL/ui/components/hover-card", () => ({
	HoverCard: ({ children }: { children: ReactNode }) => <>{children}</>,
	HoverCardTrigger: ({
		children,
		render,
	}: {
		children: ReactNode;
		render: ReactElement;
	}) => cloneElement(render, undefined, children),
	HoverCardContent: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const SERVER_URL = "http://localhost:3000";
const PLAYING_BUTTON_NAME = /playing/i;

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

describe("GameCard tracking actions", () => {
	it("tracks a game as Playing through the real tRPC/MSW network layer", async () => {
		let receivedInput: unknown;
		server.use(
			mockTrpcMutation(SERVER_URL, "userGame.add", (input) => {
				receivedInput = input;
				return undefined;
			})
		);

		const user = userEvent.setup();
		renderGameCard(baseGame);

		const playingButton = screen.getByRole("button", {
			name: PLAYING_BUTTON_NAME,
		});
		await user.click(playingButton);

		expect(playingButton).toBeDisabled();
		expect(screen.getAllByRole("button")).toHaveLength(3);

		await waitFor(() => {
			expect(receivedInput).toMatchObject({
				gameData: { igdbId: "1", title: "Hollow Knight" },
				status: "PLAYING",
			});
		});
	});
});
