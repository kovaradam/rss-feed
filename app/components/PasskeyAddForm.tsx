import { href, useRevalidator } from "react-router";
import { SubmitButton } from "./Button";
import { startRegistration } from "@simplewebauthn/browser";
import React from "react";
import { InputError } from "./InputError";

export function PasskeyAddForm() {
  const revalidator = useRevalidator();
  const [result, action] = React.useActionState(async () => {
    const result = await addPasskeyAction();
    if (result?.success) {
      revalidator.revalidate();
    }
    return result;
  }, null);
  return (
    <form action={action}>
      {result?.errors?.registration && (
        <InputError className="my-2">Could not add passkey</InputError>
      )}
      <SubmitButton className="w-full">Add new passkey</SubmitButton>
    </form>
  );
}

async function addPasskeyAction() {
  const registrationFormData = new FormData();
  registrationFormData.set("action", "add-get-options");
  const registrationOptions = await fetch(href("/api/passkey"), {
    body: registrationFormData,
    method: "post",
  }).then((r) => r.json());

  const verificationFormData = new FormData();
  verificationFormData.set("action", "add-verify");

  try {
    const result = await startRegistration({
      optionsJSON: registrationOptions,
    });
    verificationFormData.set("registration", JSON.stringify(result));
  } catch (e) {
    if (e instanceof Error && e.name === "NotAllowedError") {
      return null;
    }
    return { errors: { registration: "Could not add passkey" } };
  }

  const verifyResponse = await fetch(href("/api/passkey"), {
    body: verificationFormData,
    method: "post",
  }).then((r) => r.json());

  if (!verifyResponse.success) {
    return { errors: { registration: "Could not add passkey" } };
  }

  return { success: true };
}
