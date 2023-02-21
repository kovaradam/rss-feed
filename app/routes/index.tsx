import type { LoaderFunction, MetaFunction } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { getUserId } from '~/session.server';
import { createTitle } from '~/utils';

export const meta: MetaFunction = () => {
  return { title: createTitle('Welcome') };
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) {
    return redirect('/channels');
  } else {
    return redirect('/welcome');
  }
};
