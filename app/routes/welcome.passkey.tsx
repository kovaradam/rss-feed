import { Form, href } from "react-router";
import { SubmitButton } from "~/components/Button";
import { Route } from "./+types/welcome.passkey";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import React from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Input } from "~/components/Input";

export async function action({ request }: Route.LoaderArgs) {
  if (request.method === "delete") {
    return {};
  }
  const email = (await request.formData()).get("email");
  if (typeof email !== "string") {
    return { errors: { email: "invalid email" } };
  }
  const regOpts = await generateRegistrationOptions({
    rpID: process.env.SERVER_DOMAIN as string,
    rpName: "Web journal",
    userName: email,
    userDisplayName: email,
    attestationType: "none",
    extensions: { credProps: true },
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });
  return { regOpts: regOpts };
}

export default function PasskeyLogin(props: Route.ComponentProps) {
  const { actionData } = props;
  console.log(JSON.stringify(actionData?.regOpts, null, 2));
  React.useEffect(() => {
    if (actionData?.regOpts) {
      startRegistration({ optionsJSON: actionData.regOpts });
    }
  }, [actionData?.regOpts]);

  return actionData?.regOpts ? (
    <Form method="delete" action={href("/welcome/passkey")}>
      <SubmitButton>Abort</SubmitButton>
    </Form>
  ) : (
    <Form method="post" action={href("/welcome/passkey")}>
      <>
        <Input name="email" formLabel={"email"} required />
        <SubmitButton>passkey</SubmitButton>
      </>
    </Form>
  );
}
