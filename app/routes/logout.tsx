import type { ActionFunction } from 'react-router';
import { redirect } from 'react-router';
import { deleteUserById } from '~/models/user.server';

import { getUserId, logout } from '~/session.server';

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (request.method === 'DELETE' && userId) {
    await deleteUserById(userId);
  }

  return logout(request);
};

export const loader = async () => {
  throw redirect('/');
};
