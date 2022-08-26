import { Link } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/react/routeModules';
import type { LoaderFunction } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { primaryButtonStyle } from '~/components/Button';
import { getUserId } from '~/session.server';
import { createTitle } from '~/utils';

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) {
    return redirect('/channels');
  }
  return json({});
};

export const meta: MetaFunction = () => {
  return { title: createTitle('Welcome') };
};

export default function Welcome() {
  return (
    <main className="relative flex min-h-screen flex-col justify-center bg-white p-4 sm:items-center">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="my-2 text-4xl font-bold">RSS Journal</h1>
          <p className="text-slate-500">
            Keep up with the latest web content with your organized RSS feed
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Link
            to="/join"
            className={`flex items-center justify-center rounded-md border-2 border-blue-300 bg-white px-4 py-3  font-medium text-blue-600 hover:bg-blue-300 sm:px-8`}
          >
            Create a new account
          </Link>
          <Link
            to="/login"
            className={`${primaryButtonStyle} flex items-center justify-center rounded-md  px-4 py-3 font-medium `}
          >
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
