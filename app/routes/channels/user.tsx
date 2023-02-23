import { Outlet, useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/server-runtime';
import { UseAppTitle } from '~/components/AppTitle';
import { createMeta } from '~/utils';

export const meta = createMeta();

export function loader() {
  return json({ title: 'Profile' });
}

export default function UserIndexPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <UseAppTitle>{data.title}</UseAppTitle>
      <Outlet />
    </>
  );
}
