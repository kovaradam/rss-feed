import type { MetaFunction } from '@remix-run/react';
import { Outlet, useNavigation } from '@remix-run/react';
import { ErrorMessage } from '~/components/ErrorMessage';
import { createTitle, isNormalLoad } from '~/utils';

export const meta: MetaFunction = () => {
  return [{ title: createTitle('Welcome') }];
};

export default function Welcome() {
  const transition = useNavigation();

  return (
    <main className="relative flex h-[200vh] min-h-screen flex-col-reverse justify-center bg-white sm:h-screen sm:flex-row sm:justify-start dark:bg-slate-900 ">
      <section className="flex h-screen flex-col items-center justify-between bg-blue-100 p-[5%] sm:h-full sm:w-1/3 dark:bg-slate-950">
        <div className="flex flex-col gap-4 pb-8">
          <p className="text-balance text-4xl font-bold text-blue-900 dark:text-slate-400">
            Keep up with the latest content.
            <span className="my-8 block underline dark:text-white dark:no-underline">
              No algorithms.
            </span>
            Just the web.
          </p>
        </div>
        <img
          src="/reading.svg"
          alt="Doodle of a person reading"
          data-from="https://www.opendoodles.com/"
          className="max-w-[80%] dark:invert-[0.7]"
        />
      </section>
      <section
        className={`flex h-screen items-center justify-center p-4 sm:h-full sm:flex-1 sm:p-8 ${
          isNormalLoad(transition) ? 'animate-pulse opacity-60' : ''
        }`}
      >
        <div className="flex w-full flex-col gap-8 sm:w-[60ch]">
          <Outlet />
        </div>
      </section>
    </main>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <ErrorMessage>An unexpected error occurred: {error.message}</ErrorMessage>
  );
}
