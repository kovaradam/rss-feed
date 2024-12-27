import type { Password, Prisma, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import invariant from 'tiny-invariant';

import { prisma } from '~/db.server';
import { createDefaultCollections } from './collection.server';
import { Mail } from './mail.server';

export type { User } from '@prisma/client';

export async function getUserById(id: User['id']) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User['email']) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUsers() {
  return prisma.user.findMany();
}

export async function createUser(
  email: User['email'],
  password: string,
  params?: { isAdmin: boolean }
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      requestedEmail: email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
      isAdmin: params?.isAdmin ?? false,
    },
  });

  await createDefaultCollections(user.id);

  return user;
}

export async function validateUserEmail(id: User['id']) {
  const user = await getUserById(id);

  if (!user || !user.requestedEmail) {
    return null;
  }

  return await prisma.user.update({
    where: { id: id },
    data: {
      email: user.requestedEmail,
      requestedEmail: null,
    },
  });
}

export async function sendConfirmEmail(
  user: Pick<User, 'id' | 'requestedEmail'>,
  request: Request
) {
  invariant(user.requestedEmail, 'Requested email missing');

  const requestUrl = new URL(request.url);
  requestUrl.protocol = 'https://';

  const link = `${requestUrl.origin}/welcome/confirm-email/${user.id}`;
  return Mail.send(user.requestedEmail, {
    subject: 'Please confirm your e-mail address ✔',
    html: `Thank you for joining us!<br/><br/> Please verify your address by visiting <a href=${link}>${link}</a>`,
    text: `Thank you for joining us!\n\n Please verify your address by visiting ${link}`,
  }).catch(console.error);
}

export async function requestUpdateUserEmail(
  id: User['id'],
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
  id: User['id'],
  data: Prisma.UserUpdateArgs['data']
) {
  return await prisma.user.update({
    where: { id: id },
    data: data,
  });
}

export async function deleteUserById(id: User['id']) {
  const user = await getUserById(id);
  if (user?.isAdmin) {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    invariant(adminCount > 1, 'Cannot delete the only admin user');
  }
  return prisma.user.delete({ where: { id: id } });
}

export async function makeUserAdmin(id: User['id'], isAdmin: boolean) {
  if (!isAdmin) {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    invariant(adminCount > 1, 'Cannot disable the only admin user');
  }
  return prisma.user.update({ where: { id: id }, data: { isAdmin: isAdmin } });
}

export async function verifyLogin(
  email: User['email'],
  password: Password['hash']
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}
