import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useTransition,
} from '@remix-run/react';
import type { ActionArgs, LoaderArgs } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import { getUserById, sendConfirmEmail } from '~/models/user.server';
import { requireUserId } from '~/session.server';
import { createMeta } from '~/utils';

export const meta = createMeta(() => ({ title: 'Confirm email' }));

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);
  if (request.method !== 'PATCH') {
    throw new Response('Not supported', { status: 405 });
  }

  const user = await getUserById(userId);

  if (!user) {
    throw new Response('Not found', { status: 404 });
  }

  const mailResult = await sendConfirmEmail(user, request);

  return json({ mail: mailResult });
}

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  const user = await getUserById(userId);

  if (!user?.requestedEmail) {
    return redirect('/');
  }

  return json({ user, allowSkip: process.env.NODE_ENV !== 'production' });
}

export default function ConfirmEmailPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const transition = useTransition();

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
        .{' '}
      </p>
      <div className="mt-10 flex w-full gap-2 text-slate-400">
        <Form method="patch">
          {transition.submission?.method === 'PATCH' ? (
            <span>Sending e-mail...</span>
          ) : (
            <>
              {actionData?.mail?.accepted?.length ? (
                <span>New e-mail has been sent</span>
              ) : (
                <button type="submit">Resend e-mail</button>
              )}
            </>
          )}
        </Form>
        |
        <Form action="/logout" method="post">
          <button type="submit">Log out</button>
        </Form>
        {data.allowSkip && (
          <>
            |
            <Link className="" to={data.user.id}>
              Skip confirmation
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
