import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * クライアントサイドのブラウザ環境かどうかを確認する
 */
export const isBrowser = (): boolean => {
  return typeof window !== "undefined";
};
