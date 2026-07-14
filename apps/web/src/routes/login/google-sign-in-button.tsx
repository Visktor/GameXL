import { Button } from "@GameXL/ui/components/button";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function GoogleSignInButton() {
	return (
		<Button
			className="w-full"
			onClick={async () => {
				await authClient.signIn.social(
					{
						provider: "google",
						callbackURL: window.location.origin,
					},
					{
						onError: (error) => {
							toast.error(error.error.message || error.error.statusText);
						},
					}
				);
			}}
			type="button"
			variant="outline"
		>
			<svg
				aria-hidden="true"
				className="size-4"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48a5.54 5.54 0 0 1-2.4 3.63v3h3.89c2.27-2.09 3.55-5.17 3.55-8.82Z"
					fill="#4285F4"
				/>
				<path
					d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.89-3c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.27v3.1A12 12 0 0 0 12 24Z"
					fill="#34A853"
				/>
				<path
					d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.27a12 12 0 0 0 0 10.8l4.02-3.1Z"
					fill="#FBBC05"
				/>
				<path
					d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.6l4.02 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
					fill="#EA4335"
				/>
			</svg>
			Continue with Google
		</Button>
	);
}
