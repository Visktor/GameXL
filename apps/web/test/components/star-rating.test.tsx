import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StarRating } from "@/components/star-rating";

describe("StarRating", () => {
	it.each([
		[0, "0%"],
		[20, "20%"],
		[37, "37%"],
		[50, "50%"],
		[100, "100%"],
	])("fills %i%% score to a %s wide bar", (score, expectedWidth) => {
		const { container } = render(<StarRating score={score} />);

		const fill = container.querySelector(".filled-icons") as HTMLElement;
		expect(fill.style.width).toBe(expectedWidth);
	});
});
