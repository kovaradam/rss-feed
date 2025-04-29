import React from "react";
import { PasskeyForm } from "./PasskeyForm";
import { WithTabs } from "./WithTabs";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";

export function WithPasskeyFormTabs(props: { passwordForm: React.ReactNode }) {
  const [isSupported, setIsSupported] = React.useState(false);

  React.useEffect(() => {
    setIsSupported(browserSupportsWebAuthn());
  }, []);

  if (!isSupported) {
    return props.passwordForm;
  }

  return (
    <WithTabs
      queryParam={WithPasskeyFormTabs.queryParam}
      options={[
        {
          value: "password",
          tabLabel: "Password",
          tabPanel: props.passwordForm,
        },
        {
          value: "passkey",
          tabLabel: "Passkey",
          tabPanel: <PasskeyForm />,
        },
      ]}
      className="mb-6"
    />
  );
}

WithPasskeyFormTabs.queryParam = "lt";
