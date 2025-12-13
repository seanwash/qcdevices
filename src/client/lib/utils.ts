import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function isMacOS(): boolean {
	if (typeof navigator === "undefined") return false;
	return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}
