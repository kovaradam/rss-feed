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
    <main className="relative flex min-h-screen flex-col justify-center bg-white p-4 sm:h-screen sm:flex-row sm:justify-start sm:p-0">
      <section className="hidden flex-col items-center justify-between bg-blue-100 p-[5%] sm:flex sm:h-full sm:w-1/3">
        <h1 className="w-full text-2xl font-bold text-white">
          Welcome to RSS Journal
        </h1>
        <div className="flex flex-col gap-4">
          <p className="text-4xl font-bold text-blue-900">
            Keep up with the latest web content using your organized RSS feed.
          </p>
        </div>
        <img src="/reading.svg" alt="Doodle of a person reading"></img>
      </section>
      <section className="flex h-full flex-col gap-8 sm:flex-1 sm:items-center sm:justify-center">
        <div>
          <h2 className="my-2 text-4xl font-bold">Create your journal</h2>
          <p className="text-slate-500">
            Get started with a new account or log in if you already have one.
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
      </section>
    </main>
  );
}
