import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import React from "react";

export function useIsPasskeySupported() {
  const [isSupported] = React.useState(() => {
    if (globalThis.document) {
      return browserSupportsWebAuthn();
    } else {
      return true;
    }
  });

  return isSupported;
}
