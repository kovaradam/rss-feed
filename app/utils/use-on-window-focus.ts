import React from "react";
import { useEvent } from "./useEvent";

export function useOnWindowFocus(callback: (e: FocusEvent) => void) {
  const nonReactiveCallback = useEvent(callback);

  React.useEffect(() => {
    window.addEventListener("focus", nonReactiveCallback);
    return () => window.removeEventListener("focus", nonReactiveCallback);
  }, [nonReactiveCallback]);
}
