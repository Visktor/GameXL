import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MouseEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReleaseGame } from "@/components/game-card";
import { SearchResultRow } from "@/components/search-result-row";
import { useTrackedGamesStore } from "@/stores/tracked-games-store";
import { server } from "../support/msw-server";
import { mockTrpcMutation } from "../support/trpc-msw";

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

// Base UI's Select is floating-ui backed and hits the same dual-React
// "invalid hook call" as Dialog under Vitest/happy-dom (see
// search-command-dialog.test.tsx). Stubbed so these tests can render the row
// and exercise the wishlist button; the StatusSelect mouse path is exercised
// manually, not here.
vi.mock("@/components/status-select", () => ({
	StatusSelect: () => null,
}));

const SERVER_URL = "http://localhost:3000";
const WISHLIST_BUTTON_NAME = /add to wishlist/i;
const REMOVE_BUTTON_NAME = /remove from wishlist/i;

function renderRow(game: ReleaseGame): ReturnType<typeof render> {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<SearchResultRow game={game} />
		</QueryClientProvider>
	);
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

beforeEach(() => {
	useTrackedGamesStore.setState({ statusByGameId: {} });
});

describe("SearchResultRow", () => {
	it("quick-adds to the wishlist when the wishlist button is clicked", async () => {
		let receivedInput: unknown;
		server.use(
			mockTrpcMutation(SERVER_URL, "userGame.add", (input) => {
				receivedInput = input;
				return undefined;
			})
		);

		const user = userEvent.setup();
		renderRow(baseGame);

		await user.click(
			screen.getByRole("button", { name: WISHLIST_BUTTON_NAME })
		);

		await waitFor(() => {
			expect(receivedInput).toMatchObject({
				gameData: { igdbId: "1", title: "Hollow Knight" },
				status: "WISHLIST",
			});
		});
	});

	it("removes the game when the wishlist button is clicked while already wishlisted", async () => {
		let removeCalled = false;
		server.use(
			mockTrpcMutation(SERVER_URL, "userGame.remove", () => {
				removeCalled = true;
				return undefined;
			})
		);

		const user = userEvent.setup();
		renderRow({ ...baseGame, trackedStatus: "WISHLIST" });

		await user.click(screen.getByRole("button", { name: REMOVE_BUTTON_NAME }));

		await waitFor(() => {
			expect(removeCalled).toBe(true);
		});
	});

	it("shows an undo toast after a quick-add that restores the previous status", async () => {
		const { toast } = await import("sonner");
		server.use(
			mockTrpcMutation(SERVER_URL, "userGame.add", () => undefined),
			mockTrpcMutation(SERVER_URL, "userGame.remove", () => undefined)
		);

		const user = userEvent.setup();
		renderRow(baseGame);

		await user.click(
			screen.getByRole("button", { name: WISHLIST_BUTTON_NAME })
		);

		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith(
				"Added to Wishlist",
				expect.objectContaining({
					action: expect.objectContaining({ label: "Undo" }),
				})
			);
		});

		let removeReceived: unknown;
		server.use(
			mockTrpcMutation(SERVER_URL, "userGame.remove", (input) => {
				removeReceived = input;
				return undefined;
			})
		);

		interface CapturedToastOptions {
			action?: {
				label: string;
				onClick: (event: MouseEvent<HTMLButtonElement>) => void;
			};
		}
		const [, options] = (vi.mocked(toast.success).mock.calls.at(-1) ?? []) as [
			string,
			CapturedToastOptions,
		];
		options?.action?.onClick({} as unknown as MouseEvent<HTMLButtonElement>);

		await waitFor(() => {
			expect(removeReceived).toMatchObject({ igdbId: "1" });
		});
	});
});
