import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
	"inline-flex cursor-pointer rounded-sm items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90",
				outline:
					"border border-input bg-background hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 rounded-md px-3",
				lg: "h-11 rounded-md px-8",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	onClick?: (
		event: React.MouseEvent<HTMLButtonElement>
	) => void | Promise<void>;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		const [isLoading, setIsLoading] = React.useState(false);

		const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
			if (onClick) {
				const result = onClick(event);
				if (result instanceof Promise) {
					setIsLoading(true);
					try {
						await result;
					} finally {
						setIsLoading(false);
					}
				}
			}
		};

		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				onClick={handleClick}
				disabled={isLoading || props.disabled}
				{...props}
			>
				{isLoading ? "Loading..." : props.children}
			</Comp>
		);
	}
);
Button.displayName = "Button";

export { Button, buttonVariants };
