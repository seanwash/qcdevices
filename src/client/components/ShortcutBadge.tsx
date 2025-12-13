import { cn, isMacOS } from '@/lib/utils';

interface ShortcutBadgeProps {
    /**
     * The key combination to display (e.g., 'k', 'f', '/')
     */
    keys: string[];
    /**
     * Additional className for styling
     */
    className?: string;
}

/**
 * Component for displaying keyboard shortcuts in a Linear-style badge format
 *
 * @example
 * ```tsx
 * <ShortcutBadge keys={['meta', 'k']} />
 * ```
 */
export function ShortcutBadge({ keys, className }: ShortcutBadgeProps) {
    const isMac = isMacOS();

    const formatKey = (key: string): string => {
        const normalized = key.toLowerCase();

        if (normalized === 'meta' || normalized === 'cmd') {
            return isMac ? '⌘' : 'Ctrl';
        }

        if (normalized === 'ctrl') {
            return isMac ? '⌃' : 'Ctrl';
        }

        if (normalized === 'alt' || normalized === 'option') {
            return isMac ? '⌥' : 'Alt';
        }

        if (normalized === 'shift') {
            return isMac ? '⇧' : 'Shift';
        }

        // Capitalize single letter keys
        if (normalized.length === 1) {
            return normalized.toUpperCase();
        }

        return normalized;
    };

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1 rounded border border-border/40 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground',
                className,
            )}
        >
            {keys.map((key, index) => (
                <span key={`${key}-${index}`} className="inline-flex items-center">
                    {formatKey(key)}
                    {index < keys.length - 1 && <span className="mx-0.5 text-muted-foreground/60">+</span>}
                </span>
            ))}
        </div>
    );
}

