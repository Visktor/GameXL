import type { AppRouter } from "@GameXL/api/routers/index";
import { env } from "@GameXL/env/web";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { useSessionStore } from "@/stores/session-store";

const MAX_RETRIES = 3;

function isClientError(error: unknown): boolean {
	return (
		error instanceof TRPCClientError &&
		typeof error.data?.httpStatus === "number" &&
		error.data.httpStatus >= 400 &&
		error.data.httpStatus < 500
	);
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: (failureCount, error) =>
				!isClientError(error) && failureCount < MAX_RETRIES,
		},
	},
	queryCache: new QueryCache({
		onError: (error, query) => {
			toast.error(error.message, {
				action: {
					label: "retry",
					onClick: query.invalidate,
				},
			});
		},
	}),
});

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${env.VITE_SERVER_URL}/trpc`,
			headers() {
				const { fingerprint } = useSessionStore.getState();
				return fingerprint ? { "x-fingerprint": fingerprint } : {};
			},
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
