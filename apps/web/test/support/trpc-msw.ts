import { HttpResponse, http } from "msw";

export function mockTrpcMutation<TInput, TOutput>(
	baseUrl: string,
	procedurePath: string,
	responder: (input: TInput) => TOutput
) {
	return http.post(`${baseUrl}/trpc/${procedurePath}`, async ({ request }) => {
		const body = (await request.json()) as Record<string, TInput>;
		const data = responder(body["0"]);
		return HttpResponse.json([{ result: { data } }]);
	});
}

export function mockTrpcQuery<TInput, TOutput>(
	baseUrl: string,
	procedurePath: string,
	responder: (input: TInput) => TOutput
) {
	return http.get(`${baseUrl}/trpc/${procedurePath}`, ({ request }) => {
		const url = new URL(request.url);
		const raw = url.searchParams.get("input");
		const parsed = raw ? (JSON.parse(raw) as Record<string, TInput>) : {};
		const data = responder(parsed["0"]);
		return HttpResponse.json([{ result: { data } }]);
	});
}
