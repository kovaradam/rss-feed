import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

import { href, useNavigate, useSearchParams } from "react-router";
import { SubmitButton } from "~/components/Button";
import { Input } from "~/components/Input";
import React from "react";

export function PasskeyForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const passkeyAction = async (prev: unknown, formData: FormData) => {
    const result = await authenticateWithPasskey(formData);
    if (result?.redirect) {
      navigate(result.redirect);
    }
    return result;
  };

  const [state, action] = React.useActionState(passkeyAction, null);

  return (
    <form
      action={action}
      className="min-h-[var(--welcome-form-min-height)] space-y-6"
    >
      <>
        <Input
          name="email"
          formLabel={"Email address"}
          type="email"
          required
          autoComplete="email webauthn"
          placeholder="name@example.com"
          errors={Object.values(state?.errors ?? {}).map((e) => ({
            content: e as string,
            id: e as string,
          }))}
        />

        <input name={"action"} value={"get-options"} type={"hidden"} />

        {redirectTo && (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        )}
        <SubmitButton className="w-full">Continue</SubmitButton>
      </>
    </form>
  );
}

async function authenticateWithPasskey(registrationFormData: FormData) {
  const options = await fetch(href("/api/passkey"), {
    body: registrationFormData,
    method: "post",
  }).then((r) => r.json());
  const { registrationOptions, authenticationOptions } = options;

  const formData = new FormData();

  if (registrationOptions) {
    try {
      const response = await startRegistration({
        optionsJSON: registrationOptions,
      });
      formData.set("registration", JSON.stringify(response));
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "NotAllowedError") {
        return null;
      }
      return { errors: { registration: "Registration was unsuccessful" } };
    }
  }

  if (authenticationOptions) {
    try {
      const response = await startAuthentication({
        optionsJSON: authenticationOptions,
      });
      formData.set("authentication", JSON.stringify(response));
    } catch (e) {
      if (e instanceof Error && e.name === "NotAllowedError") {
        return null;
      }
      return { errors: { authentication: "Login was unsuccessful" } };
    }
  }

  formData.set("action", "verify");
  formData.set("email", registrationFormData.get("email") as string);

  const response = await fetch(href("/api/passkey"), {
    body: formData,
    method: "post",
  });

  try {
    const responseBody = await response.json();
    if (responseBody.errors) {
      return { errors: responseBody.errors };
    }
  } catch (e) {
    console.error(e);
  }

  if (response.ok) {
    return { redirect: response.headers.get("location") || "/channels" };
  }
  return null;
}
