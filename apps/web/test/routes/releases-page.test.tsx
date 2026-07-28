import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { cloneElement, type ReactElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import ReleasesPage from "@/routes/_index";
import { server } from "../support/msw-server";
import { mockTrpcQuery } from "../support/trpc-msw";

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

// react-virtuoso measures the scroll container to decide what to render,
// which stays zero-height under happy-dom — stubbed to render every item
// directly so these tests can assert on the resulting games/filters.
vi.mock("react-virtuoso", () => {
	function renderAllItems({
		components,
		context,
		itemContent,
		totalCount,
	}: {
		components?: { Footer?: (props: { context: unknown }) => ReactNode };
		context?: unknown;
		itemContent: (index: number) => ReactNode;
		totalCount: number;
	}) {
		const Footer = components?.Footer;
		return (
			<>
				{Array.from({ length: totalCount }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static mock list, order is stable within a render
					<div key={i}>{itemContent(i)}</div>
				))}
				{Footer ? <Footer context={context} /> : null}
			</>
		);
	}

	return { Virtuoso: renderAllItems, VirtuosoGrid: renderAllItems };
});

const SERVER_URL = "http://localhost:3000";

interface ReleasesInput {
	offset: number;
	sortBy: string;
	span: string;
}

function renderReleasesPage(): ReturnType<typeof render> {
	const queryClient = new QueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<ReleasesPage />
			</MemoryRouter>
		</QueryClientProvider>
	);
}

function gameFixture(igdbId: string, title: string) {
	return {
		igdbId,
		title,
		coverUrl: null,
		trailerVideoId: null,
		releaseDate: null,
		igdbScore: null,
		trackedStatus: null,
	};
}

describe("ReleasesPage", () => {
	it("renders a card per game once the query succeeds", async () => {
		server.use(
			mockTrpcQuery<ReleasesInput, unknown>(
				SERVER_URL,
				"releases.list",
				() => ({
					games: [
						gameFixture("1", "Hollow Knight"),
						gameFixture("2", "Celeste"),
					],
					nextOffset: null,
				})
			)
		);

		renderReleasesPage();

		expect(await screen.findAllByText("Hollow Knight")).not.toHaveLength(0);
		expect(screen.getAllByText("Celeste")).not.toHaveLength(0);
	});

	it("shows the empty state when there are no releases", async () => {
		server.use(
			mockTrpcQuery<ReleasesInput, unknown>(
				SERVER_URL,
				"releases.list",
				() => ({
					games: [],
					nextOffset: null,
				})
			)
		);

		renderReleasesPage();

		expect(
			await screen.findByText("No game releases for this period.")
		).toBeInTheDocument();
	});

	it("refetches with the new span when a sidebar filter is clicked", async () => {
		const capturedInputs: ReleasesInput[] = [];
		server.use(
			mockTrpcQuery<ReleasesInput, unknown>(
				SERVER_URL,
				"releases.list",
				(input) => {
					capturedInputs.push(input);
					return { games: [], nextOffset: null };
				}
			)
		);

		const user = userEvent.setup();
		renderReleasesPage();

		await waitFor(() => {
			expect(capturedInputs).toEqual([
				expect.objectContaining({ span: "year", sortBy: "popularity" }),
			]);
		});

		await user.click(screen.getAllByRole("button", { name: "This Week" })[0]);

		await waitFor(() => {
			expect(capturedInputs).toEqual([
				expect.objectContaining({ span: "year" }),
				expect.objectContaining({ span: "week", sortBy: "popularity" }),
			]);
		});
	});
});
