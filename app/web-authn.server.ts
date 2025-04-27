import { SERVER_ENV } from "./env.server";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  RegistrationResponseJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { prisma } from "./db.server";
import {
  getPasskeyByCredentialId,
  getPasskeysByUser,
  getUserByEmail,
} from "./models/user.server";
import { AuthenticationResponseJSON } from "@simplewebauthn/browser";

export class WebAuthnService {
  static #relyingPartyId = SERVER_ENV.domain;
  static #clearTimeoutId: NodeJS.Timeout | null = null;

  static start = async (email: string) => {
    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
      const registrationOptions = await generateRegistrationOptions({
        rpID: this.#relyingPartyId,
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
      await this.#storeChallenge({
        challenge: registrationOptions.challenge,
        email: email,
      });
      return { registrationOptions };
    } else {
      const authenticationOptions = await generateAuthenticationOptions({
        rpID: this.#relyingPartyId,

        allowCredentials: (await getPasskeysByUser(email)).map((passkey) => ({
          id: passkey.credentialId,
          transports: passkey.transports,
        })),
      });

      await this.#storeChallenge({
        challenge: authenticationOptions.challenge,
        email: email,
      });
      return { authenticationOptions };
    }
  };

  static verifyRegistration = async (params: {
    request: Request;
    registrationResponse: RegistrationResponseJSON;
    email: string;
  }) => {
    const challenge = await this.#getChallenge(params.email);

    const result = await verifyRegistrationResponse({
      response: params.registrationResponse,
      expectedChallenge: challenge as string,
      expectedOrigin: SERVER_ENV.is.prod
        ? `https://${SERVER_ENV.domain}`
        : new URL(params.request.url).origin,
      expectedRPID: this.#relyingPartyId,
    });

    return result;
  };

  static verifyAuthentication = async (params: {
    request: Request;
    authentiationResponse: AuthenticationResponseJSON;
    email: string;
  }) => {
    const challenge = await this.#getChallenge(params.email);
    const passkeyResult = await getPasskeyByCredentialId({
      credentialId: params.authentiationResponse.id,
      email: params.email,
    });

    if (!passkeyResult) {
      return null;
    }

    const result = await verifyAuthenticationResponse({
      response: params.authentiationResponse,
      credential: {
        counter: passkeyResult.passkey.counter,
        publicKey: passkeyResult.passkey.publicKey,
        id: passkeyResult.passkey.credentialId,
        transports: passkeyResult.passkey.transports,
      },
      expectedChallenge: challenge as string,
      expectedOrigin: SERVER_ENV.is.prod
        ? `https://${SERVER_ENV.domain}`
        : new URL(params.request.url).origin,
      expectedRPID: this.#relyingPartyId,
    });
    if (result.verified) {
      passkeyResult.incrementCounter();
    }
    return result;
  };

  static #storeChallenge = async (params: {
    challenge: string;
    email: string;
  }) => {
    this.#clearStaleChallenges();

    return await prisma.webAuthnChallenge.upsert({
      where: { email: params.email },
      update: { challenge: params.challenge },
      create: { challenge: params.challenge, email: params.email },
    });
  };

  static #getChallenge = async (email: string) => {
    const result = await prisma.webAuthnChallenge.findFirst({
      where: { email },
      select: { challenge: true },
    });
    await prisma.webAuthnChallenge.delete({
      where: { email },
    });
    return result?.challenge ?? null;
  };

  static #clearStaleChallenges = () => {
    if (!this.#clearTimeoutId) {
      this.#clearTimeoutId = globalThis.setTimeout(async () => {
        // https://w3c.github.io/webauthn/#sctn-timeout-recommended-range
        const fiveMinutesBack = new Date(new Date().getTime() - 1000 * 60 * 5);

        try {
          const result = await prisma.webAuthnChallenge.deleteMany({
            where: { createdAt: { lte: fiveMinutesBack } },
          });

          if (result.count) {
            console.info(`Cleared ${result.count} stale challenges`);
          }
        } catch (_) {
          console.error(`Failed to clear stale challenges`);
        }

        this.#clearTimeoutId = null;
      }, 10 * 1000);
    }
  };

  static init = () => {
    this.#clearStaleChallenges();
  };
}

WebAuthnService.init();
