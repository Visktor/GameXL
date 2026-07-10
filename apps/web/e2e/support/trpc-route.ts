import type { Page, Route } from "@playwright/test";

export function mockTrpcProcedure<TInput = unknown, TOutput = unknown>(
	page: Page,
	procedurePath: string,
	responder: (input: TInput) => TOutput
) {
	return page.route(`**/trpc/${procedurePath}**`, async (route: Route) => {
		const request = route.request();
		const input =
			request.method() === "GET"
				? getQueryInput<TInput>(request.url())
				: getBodyInput<TInput>(request.postDataJSON());

		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify([{ result: { data: responder(input) } }]),
		});
	});
}

function getQueryInput<TInput>(url: string): TInput {
	const raw = new URL(url).searchParams.get("input");
	const parsed = raw ? (JSON.parse(raw) as Record<string, TInput>) : {};
	return parsed["0"];
}

function getBodyInput<TInput>(body: unknown): TInput {
	return (body as Record<string, TInput>)["0"];
}
