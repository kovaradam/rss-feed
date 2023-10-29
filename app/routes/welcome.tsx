import { Outlet, useTransition } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/server-runtime';
import { createTitle } from '~/utils';

export const meta: MetaFunction = () => {
  return { title: createTitle('Welcome') };
};

export default function Welcome() {
  const transition = useTransition();

  return (
    <main className="relative flex h-[200vh] min-h-screen flex-col-reverse justify-center bg-white sm:h-screen sm:flex-row sm:justify-start ">
      <section className="flex h-screen flex-col items-center justify-between bg-blue-100 p-[5%] sm:h-full sm:w-1/3">
        <div className="flex flex-col gap-4">
          <p className="text-4xl font-bold text-blue-900">
            Keep up with the latest web content using an organized RSS feed.
          </p>
        </div>
        <img
          src="/reading.svg"
          alt="Doodle of a person reading"
          data-from="https://www.opendoodles.com/"
        ></img>
      </section>
      <section
        className={`flex h-screen items-center justify-center p-4 sm:h-full sm:flex-1 ${
          ['normalLoad', 'normalRedirect'].includes(transition.type)
            ? 'animate-pulse'
            : ''
        }`}
      >
        <div className="flex w-full flex-col gap-8 sm:w-[60ch] ">
          <Outlet />
        </div>
      </section>
    </main>
  );
}
