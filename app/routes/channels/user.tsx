import { requireUser } from '~/session.server';
import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { AppTitleEmitter } from '~/components/AppTitle';

export async function loader(args: LoaderArgs) {
  const user = await requireUser(args.request);
  return json(user);
}

export default function UserPage() {
  const user = useLoaderData<typeof loader>();

  return (
    <>
      <AppTitleEmitter>Your profile</AppTitleEmitter>
      <section>{user.email}</section>
    </>
  );
}
