import type { MetaFunction } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { getUserId, isKnownUser } from '~/session.server';
import { createTitle } from '~/utils';

export const meta: MetaFunction = () => {
  return [{ title: createTitle('Welcome') }];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) {
    return redirect('/channels');
  } else if (isKnownUser(request)) {
    return redirect('/welcome/login');
  } else {
    return redirect('/welcome');
  }
};
