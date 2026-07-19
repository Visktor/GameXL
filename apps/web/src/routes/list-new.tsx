import { useNavigate } from "react-router";
import { ListFormDialog } from "@/components/list-form-dialog";

export default function ListNew() {
	const navigate = useNavigate();
	const close = () => navigate("/lists");

	return (
		<ListFormDialog
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
