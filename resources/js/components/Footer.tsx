import { Github } from 'lucide-react';

export function Footer() {
    return (
        <div className="mt-16 rounded-lg border border-border/30 bg-muted/30">
            <div className="flex items-center justify-between border-b border-border/30 px-5 py-3">
                <div className="flex items-center gap-4">
                    <a
                        href="https://neuraldsp.com/device-list"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Official device list
                    </a>
                    <a
                        href="https://neuraldsp.com/quad-cortex"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Quad Cortex
                    </a>
                </div>
                <a
                    href="https://github.com/seanwash/qcdevices"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="GitHub"
                >
                    <Github className="h-5 w-5" />
                </a>
            </div>
            <div className="p-5">
                <p className="text-xs leading-relaxed text-muted-foreground">
                    Neural DSP®, Quad Cortex®, and related trademarks are registered trademarks of Neural DSP Technologies Oy. This extension is not
                    affiliated with, endorsed by, or sponsored by Neural DSP Technologies Oy.
                </p>
            </div>
        </div>
    );
}
