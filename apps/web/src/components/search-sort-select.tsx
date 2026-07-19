import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@GameXL/ui/components/select";
import { type SearchSortBy, SORT_OPTIONS } from "@/constants/search-sort";

export type { SearchSortBy } from "@/constants/search-sort";

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
