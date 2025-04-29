import type {
  Password,
  Prisma,
  User,
  WebAuthnCredential,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import invariant from "tiny-invariant";

import { prisma } from "~/db.server";
import { createDefaultCollections } from "./collection.server";
import { Mail } from "./mail.server";
import {
  AuthenticatorTransportFuture,
  VerifiedRegistrationResponse,
} from "@simplewebauthn/server";

export type { User } from "@prisma/client";

type PasskeyRegistration =
  Required<VerifiedRegistrationResponse>["registrationInfo"];

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUsersAdminView() {
  const users = await prisma.user.findMany({
    include: { passkeys: true, password: true },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    requestedEmail: u.requestedEmail,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    isAdmin: u.isAdmin,
    pw: u.password !== null,
    pk: u.passkeys.length !== 0,
  }));
}

export async function createUser(params: {
  email: User["email"];
  auth:
    | {
        type: "password";
        password: string;
      }
    | {
        type: "passkey";
        passkeyRegistration: Required<VerifiedRegistrationResponse>["registrationInfo"];
      };
  isAdmin?: boolean;
}) {
  const hashedPassword =
    params.auth.type === "password"
      ? await bcrypt.hash(params.auth.password, 10)
      : null;

  const passKey =
    params.auth.type === "passkey"
      ? getPasskeyInputFromRegistration(params.auth.passkeyRegistration)
      : null;

  const user = await prisma.user.create({
    data: {
      email: params.email,
      requestedEmail: params.email,
      isAdmin: params?.isAdmin ?? false,
      password: hashedPassword
        ? {
            create: {
              hash: hashedPassword,
            },
          }
        : undefined,
      passkeys: passKey ? { create: passKey } : undefined,
    },
  });

  await createDefaultCollections(user.id);

  return user;
}

export async function validateUserEmail(id: User["id"]) {
  const user = await getUserById(id);

  if (!user || !user.requestedEmail) {
    return null;
  }

  const updatedUser = await prisma.user.update({
    where: { id: id },
    data: {
      email: user.requestedEmail,
      requestedEmail: null,
    },
    select: {
      id: true,
      passkeys: { select: { credentialId: true } },
      password: { select: { userId: true } },
    },
  });

  return {
    loginType: updatedUser.passkeys.length
      ? "passkey"
      : updatedUser.password?.userId
        ? "password"
        : null,
  };
}

export async function sendConfirmEmail(
  user: Pick<User, "id" | "requestedEmail">,
  request: Request
) {
  invariant(user.requestedEmail, "Requested email missing");

  const requestUrl = new URL(request.url);
  requestUrl.protocol = "https://";

  const link = `${requestUrl.origin}/welcome/confirm-email/${user.id}`;
  return Mail.send(user.requestedEmail, {
    subject: "Please confirm your e-mail address ✔",
    html: `Thank you for joining us!<br/><br/> Please verify your address by visiting <a href=${link}>${link}</a>`,
    text: `Thank you for joining us!\n\n Please verify your address by visiting ${link}`,
  }).catch(console.error);
}

export async function requestUpdateUserEmail(
  id: User["id"],
  newEmail: string,
  request: Request
) {
  sendConfirmEmail({ id, requestedEmail: newEmail }, request);

  return await prisma.user.update({
    where: { id: id },
    data: {
      requestedEmail: newEmail,
    },
  });
}

export async function updateUser(
  id: User["id"],
  data: Prisma.UserUpdateArgs["data"]
) {
  return await prisma.user.update({
    where: { id: id },
    data: data,
  });
}

export async function deleteUserById(id: User["id"]) {
  const user = await getUserById(id);
  if (user?.isAdmin) {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    invariant(adminCount > 1, "Cannot delete the only admin user");
  }
  return prisma.user.delete({ where: { id: id } });
}

export async function makeUserAdmin(id: User["id"], isAdmin: boolean) {
  if (!isAdmin) {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    invariant(adminCount > 1, "Cannot disable the only admin user");
  }
  return prisma.user.update({ where: { id: id }, data: { isAdmin: isAdmin } });
}

export async function verifyLogin(
  email: User["email"],
  password: Password["hash"]
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });

  if (!userWithPassword?.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  return userWithPassword.id;
}

function getPasskeyInputFromRegistration(
  registration: PasskeyRegistration
): Omit<Prisma.WebAuthnCredentialCreateInput, "userId" | "user"> {
  const { credential } = registration;
  return {
    credentialId: credential.id,
    counter: credential.counter,
    publicKey: Buffer.from(credential.publicKey),
    deviceType: registration.credentialDeviceType,
    transports: credential.transports
      ? mapTransports.toDb(credential.transports)
      : undefined,
  };
}

export const mapTransports = {
  toDb: (transports: AuthenticatorTransportFuture[]) => transports.join(";"),
  fromDb: (transports: WebAuthnCredential["transports"]) =>
    transports?.split(";") as AuthenticatorTransportFuture[] | undefined,
};

export const getPasskeysByUser = async (email: string) => {
  try {
    return (
      await prisma.webAuthnCredential.findMany({
        where: { user: { email } },
      })
    ).map((passKey) => ({
      ...passKey,
      transports: mapTransports.fromDb(passKey.transports),
    }));
  } catch (_) {
    return [];
  }
};

export const getPasskeyByCredentialId = async (params: {
  email: string;
  credentialId: string;
}) => {
  const passkey = await prisma.webAuthnCredential.findFirst({
    where: { credentialId: params.credentialId, user: { email: params.email } },
  });
  if (!passkey) {
    return null;
  }
  return {
    passkey: {
      ...passkey,
      transports: mapTransports.fromDb(passkey.transports),
    },
    incrementCounter: () =>
      prisma.webAuthnCredential.update({
        data: { counter: { increment: 1 } },
        where: { id: passkey.id },
      }),
  };
};
