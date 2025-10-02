import React from "react";

export function useOnWindowFocus(callback: (e: FocusEvent) => void) {
  const nonReactiveCallback = React.useEffectEvent(callback);

  React.useEffect(() => {
    window.addEventListener("focus", nonReactiveCallback);
    return () => window.removeEventListener("focus", nonReactiveCallback);
  }, []);
}
