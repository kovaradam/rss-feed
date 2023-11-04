import { Link } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { getUserId } from '~/session.server';
import { createMeta } from '~/utils';

export const meta = createMeta(() => [{ title: 'Confirm email' }]);

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) {
    throw redirect('/');
  }

  return null;
}

export default function ConfirmEmailPage() {
  return (
    <section className="flex flex-col items-center justify-center p-6">
      <h1 className="my-2 mb-10 text-4xl font-bold">Email confirmed!</h1>
      <p className="text-slate-500">
        You can continue to{' '}
        <Link
          to="../login?first=true"
          className="font-bold text-rose-400 underline"
        >
          log in
        </Link>
      </p>
    </section>
  );
}
