import type { LoaderArgs } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import { getUserById, validateUserEmail } from '~/models/user.server';
import { logout } from '~/session.server';

export async function loader({ request, params }: LoaderArgs) {
  const userId = params.userId ?? '';

  const user = await getUserById(userId);

  const validatedUser = await validateUserEmail(userId);

  if (validatedUser) {
    return logout(request, '/welcome/email-confirmed');
  }

  return json({ user });
}

export default function ConfirmEmailPage() {
  return <></>;
}
