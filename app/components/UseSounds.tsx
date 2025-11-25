import React from "react";
import useSound from "~/utils/use-sound";

import tapSound from "/sounds/ui_tap-variant-01.wav?url";
import closeSound from "/sounds/navigation_backward-selection-minimal.wav?url";
import openSound from "/sounds/navigation_forward-selection-minimal.wav?url";

export function UseSounds() {
  const [playTap] = useSound(tapSound);
  const [playCloseSound] = useSound(closeSound);
  const [playOpenSound] = useSound(openSound);

  React.useEffect(() => {
    const abortController = new AbortController();

    document.addEventListener(
      "click",
      (event) => {
        if (!(event.target instanceof Element)) {
          return;
        }

        const element = event.target;

        switch (true) {
          case !!element.closest("[data-silent]"):
            break;
          case !!element.closest("button, a"):
            playTap();
            break;
          case !!element.closest("summary"):
            if ((element.parentElement as HTMLDetailsElement).open) {
              playCloseSound();
            } else {
              playOpenSound();
            }
            break;
        }
      },
      {
        signal: abortController.signal,
      },
    );

    return () => abortController.abort();
  }, [playTap, playCloseSound, playOpenSound]);

  return null;
}
