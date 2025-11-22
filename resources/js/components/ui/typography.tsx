import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const typographyElementVariants = cva('', {
    variants: {
        element: {
            h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight text-balance',
            h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0',
            h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
            h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
            p: 'leading-7 [&:not(:first-child)]:mt-6',
            blockquote: 'mt-6 border-l-2 pl-6 italic',
            list: 'my-6 ml-6 list-disc [&>li]:mt-2',
            'inline-code': 'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
        },
    },
    defaultVariants: {
        element: 'p',
    },
});

const typographyModifierVariants = cva('', {
    variants: {
        modifier: {
            lead: 'text-muted-foreground text-xl',
            large: 'text-lg font-semibold',
            small: 'text-sm leading-none font-medium',
            muted: 'text-muted-foreground text-sm',
        },
    },
});

const elementMap = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    p: 'p',
    blockquote: 'blockquote',
    list: 'ul',
    'inline-code': 'code',
} as const;

export interface TypographyProps
    extends React.HTMLAttributes<HTMLElement>,
        VariantProps<typeof typographyElementVariants>,
        VariantProps<typeof typographyModifierVariants> {
    as?: React.ElementType;
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
    ({ className, element = 'p', modifier, as, ...props }, ref) => {
        const Component = as || (element ? elementMap[element] : 'p');
        return (
            <Component
                ref={ref as never}
                className={cn(
                    typographyElementVariants({ element }),
                    typographyModifierVariants({ modifier }),
                    className
                )}
                {...props}
            />
        );
    }
);
Typography.displayName = 'Typography';

export { Typography, typographyElementVariants, typographyModifierVariants };
