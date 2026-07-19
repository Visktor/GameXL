// Column counts must be divisors of 20 (DEFAULT_PAGE_SIZE) so the last page
// never leaves an awkward partial row: 2, 4, 5, 10.
// Keyed off the grid's own container width (not the viewport) via @container
// on each route's <main> — not a shared ancestor further up, since some
// routes (e.g. the releases page) have their own internal sidebar/filter bar
// that eats into <main>'s width first. Measuring above that point would
// overcount the space actually available to the grid. This way, opening the
// game-preview side panel — which shrinks <main> without changing the
// viewport — steps column count down instead of leaving cards squeezed into
// less space than they need.
export const GAME_GRID_CLASSNAME =
	"grid grid-cols-2 gap-4 @min-[610px]:grid-cols-4 @min-[770px]:grid-cols-5 @min-[1550px]:grid-cols-10";
