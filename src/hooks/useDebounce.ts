import { useState, useEffect } from "react";

/**
 * Custom hook to debounce a value.
 * @param value The value to debounce.
 * @param delay The delay in milliseconds.
 * @param immediatePredicate Optional predicate - if returns true, value updates immediately without debounce.
 * @returns The debounced value.
 */
export function useDebounce<T>(
  value: T,
  delay: number,
  immediatePredicate?: (value: T) => boolean,
): T {
  // Check if we should update immediately
  const shouldUpdateImmediately =
    immediatePredicate && immediatePredicate(value);

  // Initialize state with the initial value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // If predicate says update immediately, skip debounce
    // We return the value directly at the end, so no need to update state here
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

  // Return the immediate value if predicate matches, otherwise the debounced state
  // This ensures synchronous reads get the correct value even before effect runs
  if (shouldUpdateImmediately) {
    return value;
  }

  return debouncedValue;
}
