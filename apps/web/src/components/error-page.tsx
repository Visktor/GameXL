import { isRouteErrorResponse, useRouteError } from "react-router";

import { NotFoundError } from "@/utils/errors";

export default function ErrorPage() {
	const error = useRouteError();

	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	const isNotFound =
		error instanceof NotFoundError ||
		(isRouteErrorResponse(error) && error.status === 404);

	if (isNotFound) {
		message = "404";
		details = "The requested page could not be found.";
	} else if (isRouteErrorResponse(error)) {
		message = "Error";
		details = error.statusText;
	} else if (import.meta.env.DEV && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="container mx-auto p-4 pt-16">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full overflow-x-auto p-4">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
