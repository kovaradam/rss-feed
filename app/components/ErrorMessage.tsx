import React from "react";

type Props = { children: React.ReactNode };

export function ErrorMessage(props: Props) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 dark:text-white ">
      <b className="text-2xl">Oops!</b>
      <div className="mb-16 text-center text-slate-500 dark:text-slate-500 ">
        {props.children}
      </div>
      <img
        alt=""
        src="/clumsy.svg"
        width={"70%"}
        data-from="https://www.opendoodles.com/"
        className="max-w-[60ch] dark:invert-[.8]"
      />
    </div>
  );
}
