import { useState, useEffect, useRef } from "react";

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
  // Use a ref to track the "expected" value for immediate updates
  // This avoids setState during render which causes double renders
  const immediateValueRef = useRef<T>(value);

  // Check if we should update immediately
  const shouldUpdateImmediately =
    immediatePredicate && immediatePredicate(value);

  // Update ref synchronously (no re-render)
  if (shouldUpdateImmediately) {
    immediateValueRef.current = value;
  }

  // Initialize state with the correct value based on predicate
  const [debouncedValue, setDebouncedValue] = useState<T>(() => {
    if (immediatePredicate && immediatePredicate(value)) {
      return value;
    }
    return value;
  });

  useEffect(() => {
    // If predicate says update immediately, do it via effect (not during render)
    if (shouldUpdateImmediately) {
      // Only update if actually different to avoid unnecessary renders
      if (debouncedValue !== value) {
        setDebouncedValue(value);
      }
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, shouldUpdateImmediately, debouncedValue]);

  // Return the immediate value if predicate matches, otherwise the debounced state
  // This ensures synchronous reads get the correct value even before effect runs
  if (shouldUpdateImmediately) {
    return value;
  }

  return debouncedValue;
}
