"use client";

import { useQueryState } from "nuqs";
import type { SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseSyncedQueryStateOptions<T> {
  equals?: (left: T, right: T) => boolean;
}

export function useSyncedQueryState<T>(
  key: string,
  parser: unknown,
  options: UseSyncedQueryStateOptions<T> = {},
) {
  const { equals = Object.is } = options;
  const [queryValue, setQueryValue] = useQueryState(key, parser as never);
  const [value, setValueState] = useState<T>(() => queryValue as T);
  const pendingPopstateRef = useRef(false);

  useEffect(() => {
    const handlePopState = () => {
      pendingPopstateRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!pendingPopstateRef.current) return;

    pendingPopstateRef.current = false;
    const frame = requestAnimationFrame(() => {
      setValueState((current) =>
        equals(current, queryValue as T) ? current : (queryValue as T),
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [equals, queryValue]);

  const setValue = useCallback(
    (next: SetStateAction<T>) => {
      setValueState((current) => {
        const resolved =
          typeof next === "function"
            ? (next as (previous: T) => T)(current)
            : next;

        if (!equals(current, resolved)) {
          void setQueryValue(resolved as never);
        }

        return resolved;
      });
    },
    [equals, setQueryValue],
  );

  return [value, setValue] as const;
}
