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
  user: Pick<User, 'id' | 'requestedEmail'>
) {
  invariant(user.requestedEmail, 'Requested email missing');

  const link = `http://localhost:3000/welcome/confirm-email/${user.id}`;
  return Mail.send(user.requestedEmail, {
    subject: 'Please confirm your e-mail address ✔', // Subject line
    html: `Verify your address by clicking this link <a href=${link}>${link}</a>`, // plain text body
  }).catch(console.error);
}

export async function requestUpdateUserEmail(id: User['id'], email: string) {
  sendConfirmEmail({ id, requestedEmail: email });

  return await prisma.user.update({
    where: { id: id },
    data: {
      requestedEmail: email,
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

export async function deleteUserByEmail(email: User['email']) {
  return prisma.user.delete({ where: { email } });
}

export async function deleteUserById(id: User['id']) {
  return prisma.user.delete({ where: { id: id } });
}

export async function makeUserAdmin(id: User['id'], isAdmin: boolean) {
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

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}
