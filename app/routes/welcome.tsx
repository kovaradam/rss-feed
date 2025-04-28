import type { MetaFunction } from "react-router";
import { Outlet } from "react-router";
import { ErrorMessage } from "~/components/ErrorMessage";
import { createTitle } from "~/utils";

export const meta: MetaFunction = () => {
  return [{ title: createTitle("Welcome") }];
};

export default function Welcome() {
  return (
    <main className="relative flex h-[200vh] min-h-screen flex-col-reverse justify-center bg-white sm:h-screen sm:flex-row sm:justify-start dark:bg-slate-900 ">
      <section className="relative flex h-screen flex-col items-center justify-between bg-blue-100 p-[5%] before:absolute before:-top-10 before:h-10 before:w-full before:rounded-tl-[25%] before:rounded-tr-[55%] before:bg-inherit before:content-[''] sm:h-full sm:w-1/3 sm:before:hidden dark:bg-slate-950">
        <div className="flex flex-col gap-4 pb-8">
          <p className="text-pretty text-4xl font-bold text-blue-900 dark:text-slate-400">
            Keep up with the latest from the web.
            <span className="mt-8 block font-normal dark:text-white">
              No algorithms.
            </span>
            <span className="mb-8 block font-normal italic dark:text-white">
              No noise.
            </span>
            Only the things that interest{" "}
            <span className="font-normal italic dark:text-white">you</span>.
          </p>
        </div>
        <img
          src="/reading.svg"
          alt=""
          data-from="https://www.opendoodles.com/"
          className="max-w-[80%] dark:invert-[0.7]"
        />
      </section>
      <section
        className={`flex h-screen items-center justify-center p-4 sm:h-full sm:flex-1 sm:p-8`}
      >
        <div className="flex w-full flex-col gap-8 sm:w-[60ch]">
          <Outlet />
        </div>
      </section>
    </main>
  );
}

export function ErrorBoundary({ error: _ }: { error: Error }) {
  return <ErrorMessage>An unexpected error occurred</ErrorMessage>;
}
