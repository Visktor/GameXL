import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@GameXL/ui/components/select";

const SORT_OPTIONS = [
	{ value: "popularity", label: "Popularity" },
	{ value: "rating", label: "Rating" },
	{ value: "recent", label: "Recently added" },
	{ value: "az", label: "A–Z" },
] as const;

export type SearchSortBy = (typeof SORT_OPTIONS)[number]["value"];

export function SearchSortSelect({
	onChange,
	value,
}: {
	onChange: (value: SearchSortBy) => void;
	value: SearchSortBy;
}) {
	return (
		<Select
			onValueChange={(next) => onChange(next as SearchSortBy)}
			value={value}
		>
			<SelectTrigger size="sm">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{SORT_OPTIONS.map(({ value: optionValue, label }) => (
					<SelectItem key={optionValue} value={optionValue}>
						{label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
