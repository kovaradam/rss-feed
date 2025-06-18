import React from "react";

export function useKeepTruthy<T>(current: T | undefined | null) {
  const [prev, setPrev] = React.useState<typeof current>(current);

  if (current && current !== prev) {
    setPrev(current);
  }

  return current ?? prev;
}
