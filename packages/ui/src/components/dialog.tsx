import { cn } from "@GameXL/ui/lib/utils";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type * as React from "react";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogBackdrop({
	className,
	...props
}: DialogPrimitive.Backdrop.Props) {
	return (
		<DialogPrimitive.Backdrop
			className={cn(
				"data-open:fade-in-0 data-closed:fade-out-0 fixed inset-0 z-50 bg-black/50 duration-100 data-closed:animate-out data-open:animate-in",
				className
			)}
			data-slot="dialog-backdrop"
			{...props}
		/>
	);
}

function DialogContent({
	className,
	children,
	showCloseButton = true,
	...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }) {
	return (
		<DialogPortal>
			<DialogBackdrop />
			<DialogPrimitive.Popup
				className={cn(
					"data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-none border bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-closed:animate-out data-open:animate-in",
					className
				)}
				data-slot="dialog-content"
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close
						className="absolute top-4 right-4 rounded-none opacity-70 outline-hidden transition-opacity hover:opacity-100 focus:opacity-100 disabled:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
						data-slot="dialog-close"
					>
						<XIcon />
						<span className="sr-only">Close</span>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Popup>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
			data-slot="dialog-header"
			{...props}
		/>
	);
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
	return (
		<DialogPrimitive.Title
			className={cn("font-semibold text-lg leading-none", className)}
			data-slot="dialog-title"
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: DialogPrimitive.Description.Props) {
	return (
		<DialogPrimitive.Description
			className={cn("text-muted-foreground text-sm", className)}
			data-slot="dialog-description"
			{...props}
		/>
	);
}

export {
	Dialog,
	DialogBackdrop,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
