import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// The `cn` helper shadcn/ui components expect at "@/lib/utils":
// merge conditional class names and de-duplicate conflicting Tailwind classes.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
