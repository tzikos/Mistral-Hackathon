import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Ensures an external link always has a protocol so it isn't treated as a relative URL.
 *  Relative paths (starting with /) are returned unchanged. */
export function externalUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return url;
  return `https://${url}`;
}
