import { WebAuthnService } from "~/web-authn.server";
import { Route } from "./+types/api.passkey";
import {
  addPasskeyToUser,
  createUser,
  getUserByEmail,
} from "~/models/user.server";
import { createUserSession, requireUser } from "~/session.server";
import invariant from "tiny-invariant";

export async function action({ request }: Route.LoaderArgs) {
  const formData = await request.formData();
  const action = formData.get("action");

  switch (action) {
    case "add-get-options": {
      const user = await requireUser(request, { email: true });
      const registrationOptions = await WebAuthnService.startRegistration(
        user.email
      );

      return registrationOptions;
    }
    case "add-verify": {
      try {
        const registrationResponse = formData.get("registration");
        invariant(typeof registrationResponse === "string");

        const user = await requireUser(request, { email: true, id: true });

        const verification = await WebAuthnService.verifyRegistration({
          request,
          registrationResponse: JSON.parse(registrationResponse),
          email: user.email,
        });

        invariant(verification.verified && verification.registrationInfo);

        await addPasskeyToUser({
          userId: user.id,
          passkeyRegistration: verification.registrationInfo,
          select: { id: true },
        });

        return { success: true };
      } catch (e) {
        console.error(e);
      }
      return { errors: { verification: "verification failed" } };
    }

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

      let user, verification, passkeyId;

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
          passkeyId = user.passkeyIds[0];
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

        if (verification?.result?.verified) {
          user = await getUserByEmail(email, { id: true });
          passkeyId = verification.passkeyId;
        }
      }

      if (user) {
        return createUserSession({
          userId: user.id,
          redirectTo: (formData.get("redirectTo") as string) ?? "/",
          request,
          credential: { type: "passkey", passkeyId: passkeyId as string },
        });
      }

      return { errors: { verification: "verification failed" } };
    }

    default:
      throw new Response("Not supported", { status: 405 });
  }
}
