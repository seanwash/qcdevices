import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const typographyElementVariants = cva("", {
	variants: {
		element: {
			h1: "scroll-m-20 text-3xl font-semibold tracking-tight text-balance leading-tight",
			h2: "scroll-m-20 border-b border-border/40 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 leading-tight",
			h3: "scroll-m-20 text-xl font-semibold tracking-tight leading-snug",
			h4: "scroll-m-20 text-lg font-semibold tracking-tight leading-snug",
			p: "leading-7 text-[15px] [&:not(:first-child)]:mt-6",
			blockquote: "mt-6 border-l-2 border-border/40 pl-6 italic",
			list: "my-6 ml-6 list-disc [&>li]:mt-2 text-[15px]",
			"inline-code":
				"bg-muted/50 relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-medium",
		},
	},
	defaultVariants: {
		element: "p",
	},
});

const typographyModifierVariants = cva("", {
	variants: {
		modifier: {
			lead: "text-muted-foreground text-lg leading-7",
			large: "text-base font-medium leading-6",
			small: "text-sm leading-5 font-medium",
			muted: "text-muted-foreground text-sm leading-6",
		},
	},
});

const elementMap = {
	h1: "h1",
	h2: "h2",
	h3: "h3",
	h4: "h4",
	p: "p",
	blockquote: "blockquote",
	list: "ul",
	"inline-code": "code",
} as const;

export interface TypographyProps
	extends React.HTMLAttributes<HTMLElement>,
		VariantProps<typeof typographyElementVariants>,
		VariantProps<typeof typographyModifierVariants> {
	as?: React.ElementType;
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
	({ className, element = "p", modifier, as, ...props }, ref) => {
		const Component = as || (element ? elementMap[element] : "p");
		return (
			<Component
				ref={ref as never}
				className={cn(
					typographyElementVariants({ element }),
					typographyModifierVariants({ modifier }),
					className,
				)}
				{...props}
			/>
		);
	},
);
Typography.displayName = "Typography";

export { Typography, typographyElementVariants, typographyModifierVariants };
