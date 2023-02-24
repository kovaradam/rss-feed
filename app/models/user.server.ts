import type { Password, Prisma, User } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { prisma } from '~/db.server';
import { createDefaultCollections } from './collection.server';

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

export async function createUser(email: User['email'], password: string) {
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

export async function updateUserEmail(id: User['id'], email: string) {
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
