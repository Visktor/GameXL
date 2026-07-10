import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HeaderSearch from "@/components/header-search";
import { useSearchStore } from "@/stores/search-store";
import { server } from "../support/msw-server";
import { mockTrpcQuery } from "../support/trpc-msw";

const navigateSpy = vi.fn();

vi.mock("react-router", async (importOriginal) => {
	const actual = await importOriginal<typeof import("react-router")>();
	return { ...actual, useNavigate: () => navigateSpy };
});

const SERVER_URL = "http://localhost:3000";
const SEARCH_PLACEHOLDER = "Search games...";

function renderHeaderSearch(): ReturnType<typeof render> {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<HeaderSearch />
			</MemoryRouter>
		</QueryClientProvider>
	);
}

beforeEach(() => {
	useSearchStore.getState().reset();
	navigateSpy.mockClear();
});

describe("HeaderSearch", () => {
	it("shows live results after debounced typing", async () => {
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
		renderHeaderSearch();

		await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), "hollow");

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
		renderHeaderSearch();

		const input = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
		await user.type(input, "zzznomatch");
		await waitFor(() => {
			expect(screen.getByText("No games found.")).toBeInTheDocument();
		});

		await user.keyboard("{Enter}");

		expect(navigateSpy).toHaveBeenCalledWith("/search?q=zzznomatch");
	});
});
