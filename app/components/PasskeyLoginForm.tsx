import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

import { href, useNavigate, useSearchParams } from "react-router";
import { SubmitButton } from "~/components/Button";
import { Input } from "~/components/Input";
import React from "react";
import { enumerate } from "~/utils";
import { ExclamationIcon } from "@heroicons/react/outline";

const inputs = enumerate(["email", "redirectTo", "action"]);

export function PasskeyLoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get(inputs["redirectTo"]);
  const mailParam = searchParams.get(inputs["email"]);

  const passkeyAction = async (_: unknown, formData: FormData) => {
    const result = await authenticateWithPasskey(formData);
    if (result?.redirect) {
      navigate(result.redirect);
      return null;
    }
    return { submitted: formData, errors: result?.errors };
  };

  const [state, action] = React.useActionState(passkeyAction, null);

  return (
    <form
      action={action}
      className="min-h-(--welcome-form-min-height) space-y-6"
    >
      <noscript>
        <div className="flex items-center gap-2 rounded border-current bg-yellow-200 p-2 pr-3 text-yellow-900 dark:border dark:bg-inherit dark:text-yellow-100">
          <ExclamationIcon className=" h-6 w-4 min-w-4" />
          <p className="text-pretty">
            Passkey authorization does not work without JavaScript enabled in
            your browser
          </p>
        </div>
      </noscript>
      <Input.Email
        name={inputs["email"]}
        formLabel={"Email address"}
        required
        autoComplete="email webauthn"
        errors={Object.values(state?.errors ?? {}).map((e) => ({
          content: e as string,
          id: e as string,
        }))}
        defaultValue={
          (state?.submitted.get(inputs["email"]) as string) ??
          (typeof mailParam === "string" ? mailParam : undefined)
        }
      />

      <input name={inputs["action"]} value={"get-options"} type={"hidden"} />

      {redirectTo && (
        <input type="hidden" name={inputs["redirectTo"]} value={redirectTo} />
      )}
      <SubmitButton className="w-full">Continue</SubmitButton>
    </form>
  );
}

async function authenticateWithPasskey(registrationFormData: FormData) {
  const options = await fetch(href("/api/passkey"), {
    body: registrationFormData,
    method: "post",
  }).then((r) => r.json());
  const { registrationOptions, authenticationOptions, errors } = options;

  if (errors) {
    return { errors };
  }

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
  formData.set("email", registrationFormData.get(inputs["email"]) as string);

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
    return { redirect: response.headers.get("location") || href("/channels") };
  }
  return null;
}
