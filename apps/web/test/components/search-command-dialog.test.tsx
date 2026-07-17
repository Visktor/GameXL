import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchCommandDialog } from "@/components/search-command-dialog";
import { useSearchStore } from "@/stores/search-store";
import { useTrackedGamesStore } from "@/stores/tracked-games-store";
import { server } from "../support/msw-server";
import { mockTrpcMutation, mockTrpcQuery } from "../support/trpc-msw";

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

// Base UI's Select is also floating-ui backed and hits the same dual-React
// "invalid hook call" as Dialog under Vitest/happy-dom (see note below) —
// stubbed so rendering a result row doesn't crash the whole suite. The
// mouse path through StatusSelect is exercised manually, not here.
vi.mock("@/components/status-select", () => ({
	StatusSelect: () => null,
}));

const navigateSpy = vi.fn();

vi.mock("react-router", async (importOriginal) => {
	const actual = await importOriginal<typeof import("react-router")>();
	return { ...actual, useNavigate: () => navigateSpy };
});

// Base UI's Dialog (floating-ui backed) triggers a dual-React "invalid hook
// call" under Vitest/happy-dom in this workspace (see grill.md's HoverCard
// note) — confirmed real-browser-only via Playwright, not a real app bug.
// Stubbed here so this suite exercises SearchCommandDialog's own logic.
vi.mock("@GameXL/ui/components/dialog", () => ({
	Dialog: ({ open, children }: { open?: boolean; children?: ReactNode }) =>
		open ? children : null,
	DialogContent: ({ children }: { children?: ReactNode }) => children,
	DialogTitle: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
	DialogDescription: ({ children }: { children?: ReactNode }) => (
		<p>{children}</p>
	),
}));

const SERVER_URL = "http://localhost:3000";
const SEARCH_PLACEHOLDER = "Search games...";

function renderSearchCommandDialog(): ReturnType<typeof render> {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<SearchCommandDialog />
			</MemoryRouter>
		</QueryClientProvider>
	);
}

beforeEach(() => {
	useSearchStore.getState().reset();
	useTrackedGamesStore.setState({ statusByGameId: {} });
	navigateSpy.mockClear();
});

describe("SearchCommandDialog", () => {
	it("is closed until Cmd+K is pressed, then shows live results after debounced typing", async () => {
		server.use(
			mockTrpcQuery(SERVER_URL, "search.list", () => ({
				games: [
					{
						igdbId: "1",
						title: "Hollow Knight",
						coverUrl: null,
						trailerVideoId: null,
						releaseDate: null,
						igdbScore: null,
						trackedStatus: null,
					},
				],
				nextOffset: null,
			}))
		);

		const user = userEvent.setup();
		renderSearchCommandDialog();

		expect(
			screen.queryByPlaceholderText(SEARCH_PLACEHOLDER)
		).not.toBeInTheDocument();

		await user.keyboard("{Meta>}k{/Meta}");

		const input = await screen.findByPlaceholderText(SEARCH_PLACEHOLDER);
		await user.type(input, "hollow");

		expect(await screen.findByText("Hollow Knight")).toBeInTheDocument();
	});

	it("navigates to the results page on Enter when there are no preview matches", async () => {
		server.use(
			mockTrpcQuery(SERVER_URL, "search.list", () => ({
				games: [],
				nextOffset: null,
			}))
		);

		const user = userEvent.setup();
		renderSearchCommandDialog();

		await user.keyboard("{Meta>}k{/Meta}");
		const input = await screen.findByPlaceholderText(SEARCH_PLACEHOLDER);
		await user.type(input, "zzznomatch");
		await waitFor(() => {
			expect(screen.getByText("No games found.")).toBeInTheDocument();
		});

		await user.keyboard("{Enter}");

		expect(navigateSpy).toHaveBeenCalledWith("/search?q=zzznomatch");
	});

	it("toggles closed on a second Cmd+K and resets the query", async () => {
		const user = userEvent.setup();
		renderSearchCommandDialog();

		await user.keyboard("{Meta>}k{/Meta}");
		const input = await screen.findByPlaceholderText(SEARCH_PLACEHOLDER);
		await user.type(input, "celeste");

		await user.keyboard("{Meta>}k{/Meta}");

		await waitFor(() => {
			expect(
				screen.queryByPlaceholderText(SEARCH_PLACEHOLDER)
			).not.toBeInTheDocument();
		});
		expect(useSearchStore.getState().query).toBe("");
	});

	it("quick-adds the highlighted result to WANT on Cmd+Enter", async () => {
		let receivedInput: unknown;
		server.use(
			mockTrpcQuery(SERVER_URL, "search.list", () => ({
				games: [
					{
						igdbId: "1",
						title: "Hollow Knight",
						coverUrl: null,
						trailerVideoId: null,
						releaseDate: null,
						igdbScore: null,
						trackedStatus: null,
					},
				],
				nextOffset: null,
			})),
			mockTrpcMutation(SERVER_URL, "userGame.add", (input) => {
				receivedInput = input;
				return undefined;
			})
		);

		const user = userEvent.setup();
		renderSearchCommandDialog();

		await user.keyboard("{Meta>}k{/Meta}");
		const input = await screen.findByPlaceholderText(SEARCH_PLACEHOLDER);
		await user.type(input, "hollow");
		await screen.findByText("Hollow Knight");

		// No ArrowDown needed — the first result is highlighted by default.
		await user.keyboard("{Meta>}{Enter}{/Meta}");

		await waitFor(() => {
			expect(receivedInput).toMatchObject({
				gameData: { igdbId: "1", title: "Hollow Knight" },
				status: "WANT",
			});
		});
		// Cmd+Enter must not also trigger the row's own Enter-to-navigate.
		expect(navigateSpy).not.toHaveBeenCalled();
	});

	it("cycles the highlighted result's status forward on Alt+ArrowRight", async () => {
		let receivedInput: unknown;
		server.use(
			mockTrpcQuery(SERVER_URL, "search.list", () => ({
				games: [
					{
						igdbId: "1",
						title: "Hollow Knight",
						coverUrl: null,
						trailerVideoId: null,
						releaseDate: null,
						igdbScore: null,
						trackedStatus: null,
					},
				],
				nextOffset: null,
			})),
			mockTrpcMutation(SERVER_URL, "userGame.add", (input) => {
				receivedInput = input;
				return undefined;
			})
		);

		const user = userEvent.setup();
		renderSearchCommandDialog();

		await user.keyboard("{Meta>}k{/Meta}");
		const input = await screen.findByPlaceholderText(SEARCH_PLACEHOLDER);
		await user.type(input, "hollow");
		await screen.findByText("Hollow Knight");

		// untracked → PLAYING (the first entry in GAME_STATUSES).
		await user.keyboard("{Alt>}{ArrowRight}{/Alt}");

		await waitFor(() => {
			expect(receivedInput).toMatchObject({
				gameData: { igdbId: "1", title: "Hollow Knight" },
				status: "PLAYING",
			});
		});
	});

	it("cycles the highlighted result's status backward on Alt+ArrowLeft", async () => {
		let receivedInput: unknown;
		server.use(
			mockTrpcQuery(SERVER_URL, "search.list", () => ({
				games: [
					{
						igdbId: "1",
						title: "Hollow Knight",
						coverUrl: null,
						trailerVideoId: null,
						releaseDate: null,
						igdbScore: null,
						trackedStatus: null,
					},
				],
				nextOffset: null,
			})),
			mockTrpcMutation(SERVER_URL, "userGame.add", (input) => {
				receivedInput = input;
				return undefined;
			})
		);

		const user = userEvent.setup();
		renderSearchCommandDialog();

		await user.keyboard("{Meta>}k{/Meta}");
		const input = await screen.findByPlaceholderText(SEARCH_PLACEHOLDER);
		await user.type(input, "hollow");
		await screen.findByText("Hollow Knight");

		// untracked → WANT (wraps backward to the last entry in the cycle).
		await user.keyboard("{Alt>}{ArrowLeft}{/Alt}");

		await waitFor(() => {
			expect(receivedInput).toMatchObject({
				gameData: { igdbId: "1", title: "Hollow Knight" },
				status: "WANT",
			});
		});
	});

	it("removes the highlighted result on Cmd+Enter when it's already WANT", async () => {
		let addCalled = false;
		let removeReceived: unknown;
		server.use(
			mockTrpcQuery(SERVER_URL, "search.list", () => ({
				games: [
					{
						igdbId: "1",
						title: "Hollow Knight",
						coverUrl: null,
						trailerVideoId: null,
						releaseDate: null,
						igdbScore: null,
						trackedStatus: "WANT",
					},
				],
				nextOffset: null,
			})),
			mockTrpcMutation(SERVER_URL, "userGame.add", () => {
				addCalled = true;
				return undefined;
			}),
			mockTrpcMutation(SERVER_URL, "userGame.remove", (input) => {
				removeReceived = input;
				return undefined;
			})
		);

		const user = userEvent.setup();
		renderSearchCommandDialog();

		await user.keyboard("{Meta>}k{/Meta}");
		const input = await screen.findByPlaceholderText(SEARCH_PLACEHOLDER);
		await user.type(input, "hollow");
		await screen.findByText("Hollow Knight");

		await user.keyboard("{Meta>}{Enter}{/Meta}");

		await waitFor(() => {
			expect(removeReceived).toMatchObject({ igdbId: "1" });
		});
		expect(addCalled).toBe(false);
	});
});
