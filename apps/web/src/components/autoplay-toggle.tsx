import { Button } from "@GameXL/ui/components/button";
import { Video, VideoOff } from "lucide-react";

import { useAutoplayPreferenceStore } from "@/stores/autoplay-preference-store";

export function AutoplayToggle() {
	const autoplayTrailers = useAutoplayPreferenceStore(
		(s) => s.autoplayTrailers
	);
	const setAutoplayTrailers = useAutoplayPreferenceStore(
		(s) => s.setAutoplayTrailers
	);
	const Icon = autoplayTrailers ? Video : VideoOff;

	return (
		<Button
			aria-label={
				autoplayTrailers
					? "Disable trailer autoplay on hover"
					: "Enable trailer autoplay on hover"
			}
			aria-pressed={autoplayTrailers}
			className="rounded-full"
			onClick={() => setAutoplayTrailers(!autoplayTrailers)}
			size="icon"
			variant="ghost"
		>
			<Icon className="h-[1.2rem] w-[1.2rem]" />
		</Button>
	);
}
