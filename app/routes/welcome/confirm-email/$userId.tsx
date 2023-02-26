import type { LoaderArgs } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { getUserById, validateUserEmail } from '~/models/user.server';

export async function loader({ params }: LoaderArgs) {
  const userId = params.userId ?? '';

  const user = await getUserById(userId);

  const validatedUser = await validateUserEmail(userId);

  if (validatedUser) {
    throw redirect('/');
  }

  return json({ user });
}

export default function ConfirmEmailPage() {
  return <></>;
}
