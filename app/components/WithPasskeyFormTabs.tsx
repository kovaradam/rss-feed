import React from "react";
import { PasskeyLoginForm } from "./PasskeyLoginForm";
import { WithTabs } from "./WithTabs";
import { useIsPasskeySupported } from "~/utils/use-is-passkey-supported";

export function WithPasskeyFormTabs(props: { passwordForm: React.ReactNode }) {
  const isSupported = useIsPasskeySupported();

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
          tabPanel: <PasskeyLoginForm />,
        },
      ]}
      className="mb-6"
    />
  );
}

WithPasskeyFormTabs.queryParam = "lt";
