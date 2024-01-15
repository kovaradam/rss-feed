import type { LoaderFunctionArgs } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import { validateUserEmail } from '~/models/user.server';
import { logout } from '~/session.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = params.userId ?? '';

  const validatedUser = await validateUserEmail(userId);

  if (validatedUser) {
    return logout(request, '/welcome/email-confirmed');
  }

  return json({});
}

export default function ConfirmEmailPage() {
  return <></>;
}
