import { Github, TrainFront } from 'lucide-react';

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
                <div className="flex items-center gap-4">
                    <a
                        href="https://railway.com?referralCode=XDmrCa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded border border-border/40 bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                        aria-label="Hosted on Railway"
                    >
                        <span>Hosted on Railway</span>
                        <TrainFront className="h-4 w-4" />
                    </a>
                    <a
                        href="https://github.com/seanwash/qcdevices"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded border border-border/40 bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                        aria-label="GitHub"
                    >
                        <span>GitHub</span>
                        <Github className="h-4 w-4" />
                    </a>
                </div>
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
