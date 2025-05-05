import type {
  Password,
  Prisma,
  User,
  WebAuthnCredential,
} from "~/__generated__/prisma/client";
import bcrypt from "bcryptjs";
import invariant from "tiny-invariant";

import { prisma } from "~/db.server";
import { createDefaultCollections } from "./collection.server";
import { Mail } from "./mail.server";
import {
  AuthenticatorTransportFuture,
  VerifiedRegistrationResponse,
} from "@simplewebauthn/server";
import { SERVER_ENV } from "~/env.server";
import { href } from "react-router";

export type { User } from "~/__generated__/prisma/client";

type PasskeyRegistration =
  Required<VerifiedRegistrationResponse>["registrationInfo"];

type UserSelect = Prisma.UserSelect;

export async function getUserById<T extends UserSelect>(
  id: User["id"],
  select: T
) {
  return prisma.user.findUnique({ where: { id }, select });
}

export async function getUserByEmail<T extends UserSelect>(
  email: User["email"],
  select: T
) {
  return prisma.user.findUnique({ where: { email }, select });
}

export async function getUsersAdminView() {
  const users = await prisma.user.findMany({
    include: { passkeys: true, password: true, sessions: true },
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
    sessions: u.sessions.length,
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
        passkeyRegistration: PasskeyRegistration;
      };
  isAdmin?: boolean;
  disableConfirmEmail?: boolean;
}) {
  const hashedPassword =
    params.auth.type === "password"
      ? await hashPassword(params.auth.password)
      : null;

  const passkey =
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
      passkeys: passkey ? { create: passkey } : undefined,
    },
    select: {
      id: true,
      requestedEmail: true,
      passkeys: { select: { id: true } },
      password: { select: { id: true } },
    },
  });

  await createDefaultCollections(user.id);

  if (!params.disableConfirmEmail) {
    sendConfirmEmail(user);
  }

  return user;
}

export async function validateUserEmail(id: User["id"]) {
  const user = await getUserById(id, { requestedEmail: true });

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
      email: true,
    },
  });

  return {
    loginType: updatedUser.passkeys.length
      ? "passkey"
      : updatedUser.password?.userId
        ? "password"
        : null,
    email: updatedUser.email,
  };
}

export async function sendConfirmEmail(
  user: Pick<User, "id" | "requestedEmail">
) {
  invariant(user.requestedEmail, "Requested email missing");

  const link = `https://${SERVER_ENV.domain}${href(
    "/welcome/confirm-email/:userId",
    { userId: user.id }
  )}`;
  return Mail.send(user.requestedEmail, {
    subject: "Please confirm your e-mail address ✔",
    html: `Thank you for joining us!<br/><br/> Please verify your address by visiting <a href=${link}>${link}</a>`,
    text: `Thank you for joining us!\n\n Please verify your address by visiting ${link}`,
  }).catch(console.error);
}

export async function requestUpdateUserEmail<T extends UserSelect>(
  id: User["id"],
  newEmail: string,
  select: T
) {
  sendConfirmEmail({ id, requestedEmail: newEmail });

  return await prisma.user.update({
    where: { id: id },
    data: {
      requestedEmail: newEmail,
    },
    select,
  });
}

export async function updateUser<T extends UserSelect>(
  id: User["id"],
  data: Prisma.UserUpdateArgs["data"],
  select: T
) {
  return await prisma.user.update({
    where: { id: id },
    data: data,
    select: select ?? {},
  });
}

export async function deleteUserById(id: User["id"]) {
  const user = await getUserById(id, { isAdmin: true });
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
  return prisma.user.update({
    where: { id: id },
    data: { isAdmin: isAdmin },
    select: { isAdmin: true, email: true },
  });
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

  return {
    userId: userWithPassword.id,
    passwordId: userWithPassword.password.id,
  };
}

export async function updatePassword(params: {
  userId: string;
  newPassword: string;
}) {
  const user = await prisma.user.findFirst({
    where: { id: params.userId },
    select: { password: true },
  });

  if (user?.password) {
    await prisma.user.update({
      where: { id: params.userId },
      data: {
        password: {
          delete: true,
        },
      },
    });
  }

  const hashedPassword = await hashPassword(params.newPassword);

  const updatedUser = await prisma.user.update({
    where: { id: params.userId },
    data: {
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
    select: { id: true },
  });

  return updatedUser;
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

export async function addPasskeyToUser<T extends UserSelect>(params: {
  userId: string;
  passkeyRegistration: PasskeyRegistration;
  select: T;
}) {
  return prisma.user.update({
    where: { id: params.userId },
    data: {
      passkeys: {
        create: getPasskeyInputFromRegistration(params.passkeyRegistration),
      },
    },
    select: params.select,
  });
}

export async function removePasskeyOfUser<T extends UserSelect>(params: {
  userId: string;
  passkeyId: string;
  select: T;
}) {
  return prisma.user.update({
    where: { id: params.userId },
    data: {
      passkeys: {
        delete: { id: params.passkeyId },
      },
    },
    select: params.select,
  });
}

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
    updateCounter: (counter: number) =>
      prisma.webAuthnCredential.update({
        data: { counter: counter, lastUsedAt: new Date() },
        where: { id: passkey.id },
      }),
  };
};

function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
