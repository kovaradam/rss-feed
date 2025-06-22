import type {
  EmailRequest,
  Password,
  PasswordReset,
  Prisma,
  User,
  WebAuthnCredential,
} from "~/__generated__/prisma/client";
import bcrypt from "bcryptjs";
import invariant from "tiny-invariant";

import { prisma } from "~/db.server";
import { createDefaultCollections } from "./collection.server";
import {
  AuthenticatorTransportFuture,
  VerifiedRegistrationResponse,
} from "@simplewebauthn/server";
import { createTtl } from "~/utils.server";
import { sendConfirmEmail, sendPasswordResetEmail } from "./user.mail.server";

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
    include: {
      passkeys: true,
      password: true,
      sessions: true,
      emailRequest: true,
    },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    requestedEmail: u.emailRequest?.email,
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
      emailRequest: {
        create: {
          email: params.email,
        },
      },
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
      emailRequest: true,
      passkeys: { select: { id: true } },
      password: { select: { id: true } },
    },
  });

  await createDefaultCollections(user.id);

  if (!params.disableConfirmEmail && user.emailRequest) {
    sendConfirmEmail(user.emailRequest);
  }

  return {
    id: user.id,
    passwordId: user.password?.id,
    passkeyIds: user.passkeys.map((p) => p.id),
  };
}

export async function validateUserEmail(requestId: EmailRequest["id"]) {
  const emailRequest = await getEmailRequest(requestId);
  if (!emailRequest) {
    return null;
  }

  const updatedUser = await prisma.user.update({
    where: { id: emailRequest.userId },
    data: {
      email: emailRequest.email,
      emailRequest: { delete: true },
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

export async function requestPasswordReset(email: User["email"]) {
  const user = await getUserByEmail(email, {
    id: true,
    passwordReset: { select: { id: true } },
  });
  invariant(user);

  if (user?.passwordReset) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordReset: { delete: true } },
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordReset: {
        create: {},
      },
    },
    select: { passwordReset: true, email: true },
  });

  invariant(updatedUser.passwordReset?.id);
  const operationId = updatedUser.passwordReset.id;

  sendPasswordResetEmail(operationId, updatedUser.email);

  return { operationId };
}

export async function requestUpdateUserEmail(id: User["id"], newEmail: string) {
  const userByEmail = await getUserByEmail(newEmail, { email: true });
  if (userByEmail) {
    return "email-taken-error";
  }

  const updatedUser = await prisma.user.update({
    where: { id: id },
    data: {
      emailRequest: { create: { email: newEmail } },
    },
    select: { emailRequest: true },
  });

  if (updatedUser.emailRequest) {
    sendConfirmEmail(updatedUser.emailRequest);
  }

  return updatedUser;
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
  const userWithPassword = await prisma.user
    .findUnique({
      where: { email },
      include: {
        password: true,
      },
    })
    .catch(() => null);

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

export async function resetPassword(params: {
  operationId: string;
  newPassword: string;
}) {
  const operation = await getPasswordReset(params.operationId).catch(
    () => null
  );

  if (!operation) {
    return null;
  }

  const updatedUser = await updatePassword({
    userId: operation.userId,
    newPassword: params.newPassword,
  });

  await prisma.passwordReset.delete({ where: { id: operation.id } });

  if (!updatedUser) {
    return null;
  }
  return "success";
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

export async function getPasswordReset(operationId: PasswordReset["id"]) {
  const operation = await prisma.passwordReset.findUnique({
    where: { id: operationId },
  });

  if (!operation) {
    return null;
  }

  if (operation.createdAt.getTime() + PASSWORD_RESET_TTL < Date.now()) {
    await prisma.passwordReset.delete({ where: { id: operationId } });
    return null;
  }

  return operation;
}

const PASSWORD_RESET_TTL = createTtl(
  1000 * 60 * 5 /** 5 minutes */,
  async (ttl) => {
    prisma.passwordReset.deleteMany({
      where: { createdAt: { lte: new Date(Date.now() - ttl) } },
    });
  },
  "0 * * * *" // every hour
);

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

async function getEmailRequest(requestId: string) {
  const emailRequest = await prisma.emailRequest.findUnique({
    where: { id: requestId },
  });

  if (!emailRequest) {
    return null;
  }

  return emailRequest;
}
