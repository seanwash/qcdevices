import { isMacOS } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface UseKeyboardShortcutOptions {
    /**
     * The key to listen for (e.g., 'k', 'f', '/')
     */
    key: string;
    /**
     * Whether to require Cmd (Mac) or Ctrl (Windows/Linux)
     */
    metaKey?: boolean;
    /**
     * Whether to require Shift key
     */
    shiftKey?: boolean;
    /**
     * Whether to require Alt/Option key
     */
    altKey?: boolean;
    /**
     * Callback function to execute when shortcut is triggered
     */
    callback: (event: KeyboardEvent) => void;
    /**
     * Whether to prevent default browser behavior
     */
    preventDefault?: boolean;
    /**
     * Whether the shortcut should be disabled
     */
    disabled?: boolean;
    /**
     * Element ref to check if focus is within (prevents triggering when typing in inputs)
     */
    ignoreWhenFocused?: React.RefObject<HTMLElement | null>;
}

/**
 * Hook for managing keyboard shortcuts
 *
 * @example
 * ```tsx
 * const inputRef = useRef<HTMLInputElement>(null);
 * useKeyboardShortcut({
 *   key: 'k',
 *   metaKey: true,
 *   callback: () => inputRef.current?.focus(),
 *   ignoreWhenFocused: inputRef,
 * });
 * ```
 */
export function useKeyboardShortcut({
    key: targetKey,
    metaKey = false,
    shiftKey = false,
    altKey = false,
    callback,
    preventDefault = true,
    disabled = false,
    ignoreWhenFocused,
}: UseKeyboardShortcutOptions): void {
    const callbackRef = useRef(callback);

    // Keep callback ref up to date
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (disabled) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent): void => {
            // Check if focus is within the ignored element
            if (ignoreWhenFocused?.current && ignoreWhenFocused.current.contains(document.activeElement)) {
                return;
            }

            // Check if the pressed key matches
            if (event.key.toLowerCase() !== targetKey.toLowerCase()) {
                return;
            }

            // Check modifier keys
            const metaPressed = isMacOS() ? event.metaKey : event.ctrlKey;

            if (metaKey && !metaPressed) {
                return;
            }

            if (shiftKey && !event.shiftKey) {
                return;
            }

            if (altKey && !event.altKey) {
                return;
            }

            // Ensure other modifiers aren't pressed (unless explicitly required)
            if (!metaKey && metaPressed) {
                return;
            }

            if (!shiftKey && event.shiftKey) {
                return;
            }

            if (!altKey && event.altKey) {
                return;
            }

            if (preventDefault) {
                event.preventDefault();
            }

            callbackRef.current(event);
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [targetKey, metaKey, shiftKey, altKey, preventDefault, disabled, ignoreWhenFocused]);
}

