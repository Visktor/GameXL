import { describe, expect, it } from "vitest";
import { app } from "@/app";

describe("GET /", () => {
	it("returns OK through the real middleware stack", async () => {
		const res = await app.request("/");

		expect(res.status).toBe(200);
		expect(await res.text()).toBe("OK");
	});

	it("applies the configured CORS origin", async () => {
		const res = await app.request("/", {
			headers: { origin: "http://localhost:3001" },
		});

		expect(res.headers.get("access-control-allow-origin")).toBe(
			"http://localhost:3001"
		);
	});
});
