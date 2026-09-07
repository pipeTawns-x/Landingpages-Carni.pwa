import { useCallback, useEffect, useState } from 'react';

/**
 * The project's one data-fetching hook: loading, success, error and retry.
 *
 * Every request in a UI has three states, not one — "not here yet", "here" and
 * "it failed" — and each is a different screen for the customer. Rebuilding that
 * triple in every component is how they drift apart, so it lives here once.
 *
 * Two things this hook does that a course example usually does not, both learned
 * from real defects:
 *
 * 1. **`isLoading` is cleared in `finally`, never inside `try`.** Clearing it on
 *    the success path leaves a failed request spinning forever and the error
 *    message never reaches the screen. The symptom — an eternal spinner — points
 *    nowhere near the cause.
 *
 * 2. **Supabase does not throw.** It returns `{ data, error }`, so a `try/catch`
 *    around it catches nothing and a failure passes silently with `data` at
 *    null. The query function passed in must surface its own error.
 */
export interface SupabaseQueryResult<T> {
  datos: T | null;
  isLoading: boolean;
  error: Error | null;
  /** Re-runs the query. This is the retry button's handler. */
  reintentar: () => void;
}

export function useSupabaseQuery<T>(
  consulta: () => Promise<T>,
  dependencias: ReadonlyArray<unknown> = []
): SupabaseQueryResult<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  // Bumping this counter re-runs the effect. It is the whole retry mechanism:
  // no imperative refetch, no ref, just a dependency that changed.
  const [intento, setIntento] = useState<number>(0);

  const reintentar = useCallback(() => {
    setIntento((n) => n + 1);
  }, []);

  useEffect(() => {
    // A slow request that resolves after the component unmounts — or after a
    // retry superseded it — must not write state, or a stale response
    // overwrites a newer one.
    let vigente = true;

    setIsLoading(true);
    setError(null);

    consulta()
      .then((resultado) => {
        if (vigente) {
          setDatos(resultado);
        }
      })
      .catch((e: unknown) => {
        if (vigente) {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      })
      .finally(() => {
        if (vigente) {
          setIsLoading(false);
        }
      });

    return () => {
      vigente = false;
    };
    // `consulta` is intentionally left out: an inline arrow is a new function on
    // every render, so including it would refetch forever. The caller declares
    // what the query actually depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, intento]);

  return { datos, isLoading, error, reintentar };
}
