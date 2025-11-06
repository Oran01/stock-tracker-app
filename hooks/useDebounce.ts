/**
 * File: hooks/useDebounce.ts
 * Purpose: Provide a lightweight client-side debounce utility hook.
 * Exports: `useDebounce`
 *
 * Key ideas:
 * - Wraps a callback and delays execution until `delay` ms have passed
 *   without the function being re-invoked.
 * - Useful for search bars, auto-save, filtering, and expensive UI updates.
 * - Stores timeout in a ref to persist between renders without re-renders.
 *
 * @remarks
 * - This hook does not cancel callbacks on unmount; callers may add cleanup if needed.
 * - Debounce interval (`delay`) is stable per render — changes will reset the timer.
 * - If the callback changes identity, the debounce is recreated (per dependency array).
 */

"use client";

import { useCallback, useRef } from "react";

/**
 * useDebounce
 * @summary Returns a debounced function that delays invoking `callback`
 *          until after `delay` ms have elapsed since the last call.
 *
 * @param callback - Function to execute after the debounce delay.
 * @param delay - Delay duration in milliseconds.
 * @returns A debounced function — call it instead of the raw callback.
 *
 * @example
 * const debounced = useDebounce(() => {
 *   searchStocks(query);
 * }, 400);
 *
 * <input onChange={(e) => debounced()} />
 *
 * @remarks
 * - Internal timeout is stored in a ref, not state — avoids re-renders.
 * - Subsequent calls reset the timer (classic debounce behavior).
 * - Perfect for input-driven operations in Client Components.
 */
export function useDebounce(callback: () => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(callback, delay);
  }, [callback, delay]);
}
