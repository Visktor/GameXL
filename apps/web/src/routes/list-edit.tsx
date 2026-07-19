import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { ListFormDialog } from "@/components/list-form-dialog";
import { NotFoundError } from "@/utils/errors";
import { trpcClient } from "@/utils/trpc";

export default function ListEdit() {
	const { listId } = useParams<{ listId: string }>();
	const navigate = useNavigate();

	if (!listId) {
		throw new NotFoundError("Missing list route param");
	}

	const listQuery = useQuery({
		queryKey: ["gameList", "get", listId],
		queryFn: () => trpcClient.gameList.get.query({ listId }),
	});

	const close = () => navigate(`/lists/${listId}`);

	if (listQuery.status !== "success") {
		return null;
	}

	return (
		<ListFormDialog
			list={listQuery.data}
			onOpenChange={(open) => {
				if (!open) {
					close();
				}
			}}
			onSaved={close}
			open
		/>
	);
}
