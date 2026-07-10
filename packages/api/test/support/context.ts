import { vi } from "vitest";
import type { Context } from "@/context";

export function createTestContext(
	overrides: Partial<Pick<Context, "session" | "guestSession">> = {}
): Context {
	return {
		session: null,
		guestSession: null,
		logger: {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
		} as unknown as Context["logger"],
		honoContext: {
			req: { header: () => undefined },
		} as unknown as Context["honoContext"],
		...overrides,
	};
}
