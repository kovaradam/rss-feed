import { WebAuthnService } from "~/web-authn.server";
import { Route } from "./+types/api.passkey";
import { createUser, getUserByEmail } from "~/models/user.server";
import { createUserSession } from "~/session.server";

export async function action({ request }: Route.LoaderArgs) {
  const formData = await request.formData();
  const action = formData.get("action");

  switch (action) {
    case "abort":
      return {};

    case "get-options": {
      const email = formData.get("email");

      if (typeof email !== "string") {
        return { errors: { email: "invalid email" } };
      }

      try {
        const { registrationOptions, authenticationOptions } =
          await WebAuthnService.start(email);

        return {
          registrationOptions,
          authenticationOptions,
        };
      } catch (e) {
        console.error(e);
        return new Response(null, { status: 500 });
      }
    }
    case "verify": {
      const registrationResponse = formData.get("registration");

      const email = formData.get("email");
      if (typeof email !== "string") {
        return { errors: { email: "email invalid" } };
      }

      let user, verification;

      if (typeof registrationResponse === "string") {
        verification = await WebAuthnService.verifyRegistration({
          request,
          registrationResponse: JSON.parse(registrationResponse),
          email: email,
        });

        if (verification.verified && verification.registrationInfo) {
          user = await createUser({
            email,
            auth: {
              passkeyRegistration: verification.registrationInfo,
              type: "passkey",
            },
          });
        }
      }

      const authenticationResponse = formData.get("authentication");

      if (typeof authenticationResponse === "string") {
        const parsedAuthentiationResponse = JSON.parse(authenticationResponse);

        verification = await WebAuthnService.verifyAuthentication({
          request,
          authentiationResponse: parsedAuthentiationResponse,
          email: email,
        });

        if (verification?.verified) {
          user = await getUserByEmail(email);
        }
      }

      if (user) {
        return createUserSession({
          userId: user.id,
          redirectTo: (formData.get("redirectTo") as string) ?? "/",
          request,
        });
      }

      return { errors: { verification: "verification failed" } };
    }

    default:
      throw new Response("Not supported", { status: 405 });
  }
}
