import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

/**
 * Wrap callback with a stable identity function
 */
export function useEvent<T extends AnyFunction>(callback?: T) {
  const ref = React.useRef<AnyFunction | undefined>(() => {
    throw new Error('Cannot call an event handler while rendering.');
  });
  React.useEffect(() => {
    ref.current = callback;
  });
  return React.useCallback<AnyFunction>(
    (...args) => ref.current?.apply(null, args),
    []
  ) as T;
}
