import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@GameXL/ui/components/dialog";
import { cn } from "@GameXL/ui/lib/utils";
import {
	CommandEmpty as CommandEmptyPrimitive,
	CommandGroup as CommandGroupPrimitive,
	CommandInput as CommandInputPrimitive,
	CommandItem as CommandItemPrimitive,
	CommandList as CommandListPrimitive,
	Command as CommandPrimitive,
} from "cmdk";
import { SearchIcon } from "lucide-react";
import type * as React from "react";

function Command({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			className={cn(
				"flex h-full w-full flex-col overflow-hidden rounded-none bg-popover text-popover-foreground",
				className
			)}
			data-slot="command"
			{...props}
		/>
	);
}

function CommandInput({
	className,
	...props
}: React.ComponentProps<typeof CommandInputPrimitive>) {
	return (
		<div
			className="flex h-12 items-center gap-3 border-b px-4"
			data-slot="command-input-wrapper"
		>
			<SearchIcon className="size-5 shrink-0 text-muted-foreground" />
			<CommandInputPrimitive
				className={cn(
					"flex h-12 w-full rounded-none bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
					className
				)}
				data-slot="command-input"
				{...props}
			/>
		</div>
	);
}

function CommandList({
	className,
	...props
}: React.ComponentProps<typeof CommandListPrimitive>) {
	return (
		<CommandListPrimitive
			className={cn(
				"max-h-80 scroll-py-1 overflow-y-auto overflow-x-hidden",
				className
			)}
			data-slot="command-list"
			{...props}
		/>
	);
}

function CommandEmpty(
	props: React.ComponentProps<typeof CommandEmptyPrimitive>
) {
	return (
		<CommandEmptyPrimitive
			className="py-6 text-center text-muted-foreground text-xs"
			data-slot="command-empty"
			{...props}
		/>
	);
}

function CommandGroup({
	className,
	...props
}: React.ComponentProps<typeof CommandGroupPrimitive>) {
	return (
		<CommandGroupPrimitive
			className={cn(
				"overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs",
				className
			)}
			data-slot="command-group"
			{...props}
		/>
	);
}

function CommandItem({
	className,
	...props
}: React.ComponentProps<typeof CommandItemPrimitive>) {
	return (
		<CommandItemPrimitive
			className={cn(
				"relative flex cursor-default select-none items-center gap-2 rounded-none px-2 py-2 text-xs outline-hidden data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className
			)}
			data-slot="command-item"
			{...props}
		/>
	);
}

function CommandDialog({
	title = "Search games",
	description = "Search for a game by title",
	children,
	className,
	showCloseButton = true,
	shouldFilter,
	value,
	onValueChange,
	...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
	children?: React.ReactNode;
	className?: string;
	description?: string;
	onValueChange?: (value: string) => void;
	shouldFilter?: boolean;
	showCloseButton?: boolean;
	title?: string;
	value?: string;
}) {
	return (
		<Dialog {...props}>
			<DialogContent
				className={cn("max-w-xl overflow-hidden p-0", className)}
				showCloseButton={showCloseButton}
			>
				<DialogTitle className="sr-only">{title}</DialogTitle>
				<DialogDescription className="sr-only">{description}</DialogDescription>
				<Command
					onValueChange={onValueChange}
					shouldFilter={shouldFilter}
					value={value}
				>
					{children}
				</Command>
			</DialogContent>
		</Dialog>
	);
}

export {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
};
