import { Link, useLoaderData } from '@remix-run/react';
import type { LoaderArgs } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import { getUserById } from '~/models/user.server';
import { requireUserId } from '~/session.server';

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  const user = await getUserById(userId);

  if (!user?.requestedEmail) {
    return redirect('/');
  }

  return json({ user });
}

export default function ConfirmEmailPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <section className="flex flex-col items-center justify-center p-6">
      <h1 className="my-2 mb-10 text-4xl font-bold">
        Please confirm your email address.
      </h1>
      <p>
        An email with confirmation link has been sent to your address{' '}
        <a
          href={`mailto:${data.user?.requestedEmail}`}
          className="text-rose-400"
        >
          <b>{data.user?.requestedEmail}</b>
        </a>
        .
      </p>
      <Link to={data.user.id}>Or nah</Link>
    </section>
  );
}
