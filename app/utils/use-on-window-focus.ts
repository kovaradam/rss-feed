import React from "react";

export function useOnWindowFocus(
  callback: (e: FocusEvent, signal: AbortSignal) => void,
) {
  const nonReactiveCallback = React.useEffectEvent(callback);

  React.useEffect(() => {
    const controller = new AbortController();
    window.addEventListener(
      "focus",
      (e) => nonReactiveCallback(e, controller.signal),
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, []);
}
