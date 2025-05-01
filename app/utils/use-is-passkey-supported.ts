import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import React from "react";

export function useIsPasskeySupported() {
  const [isSupported, setIsSupported] = React.useState(false);

  React.useLayoutEffect(() => {
    setIsSupported(browserSupportsWebAuthn());
  }, []);

  return isSupported;
}
