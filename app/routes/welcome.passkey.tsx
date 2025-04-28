import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

import { href, redirect, useNavigate, useSearchParams } from "react-router";
import { SubmitButton } from "~/components/Button";
import { Input } from "~/components/Input";
import { getUserId } from "~/session.server";
import { Route } from "./+types/welcome.passkey";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    throw redirect("/channels");
  }
  return {};
};

export default function PasskeyLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  return (
    <form
      method="post"
      onSubmit={async (e) => {
        e.preventDefault();
        const registrationFormData = new FormData(e.currentTarget);
        const options = await fetch(href("/api/passkey"), {
          body: registrationFormData,
          method: "post",
        }).then((r) => r.json());
        const { registrationOptions, authenticationOptions } = options;

        const formData = new FormData();

        if (registrationOptions) {
          const response = await startRegistration({
            optionsJSON: registrationOptions,
          });
          formData.set("registration", JSON.stringify(response));
        }

        if (authenticationOptions) {
          const response = await startAuthentication(authenticationOptions);
          formData.set("authentication", JSON.stringify(response));
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
            return;
          }
        } catch (e) {
          console.error(e);
        }

        if (response.ok) {
          navigate(response.headers.get("location") || "/channels");
        }
      }}
    >
      <>
        <Input
          name="email"
          formLabel={"email"}
          type="email"
          required
          autoComplete="email webauthn"
        />
        <input name={"action"} value={"get-options"} type={"hidden"} />
        {redirectTo && (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        )}
        <SubmitButton>passkey</SubmitButton>
      </>
    </form>
  );
}
