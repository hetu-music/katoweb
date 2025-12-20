import { useState, useEffect } from "react";

/**
 * Custom hook to debounce a value.
 * @param value The value to debounce.
 * @param delay The delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce<T>(
  value: T,
  delay: number,
  immediatePredicate?: (value: T) => boolean,
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  // Check if we should update immediately
  const shouldUpdateImmediately =
    immediatePredicate && immediatePredicate(value);

  // Update logic pattern for derived state during render
  if (shouldUpdateImmediately && value !== debouncedValue) {
    setDebouncedValue(value);
  }

  useEffect(() => {
    // If we've already updated immediately, we don't need the timer
    if (shouldUpdateImmediately) {
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, shouldUpdateImmediately]);

  return debouncedValue;
}
