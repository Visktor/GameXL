import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchCommandDialog } from "@/components/search-command-dialog";
import { useSearchStore } from "@/stores/search-store";
import { server } from "../support/msw-server";
import { mockTrpcQuery } from "../support/trpc-msw";

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
});
