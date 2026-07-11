import { Rating } from "react-simple-star-rating";

const MAX_STARS = 5;
const STAR_SIZE = 12;

export function StarRating({ score }: { score: number }) {
	return (
		<Rating
			allowFraction
			emptyColor="var(--muted-foreground)"
			fillColor="#facc15"
			initialValue={(score / 100) * MAX_STARS}
			readonly
			SVGstorkeWidth={0}
			SVGstyle={{ display: "inline-block" }}
			size={STAR_SIZE}
		/>
	);
}
