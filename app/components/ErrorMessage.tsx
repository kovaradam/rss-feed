import React from 'react';

type Props = { children: React.ReactNode };

export function ErrorMessage(props: Props): JSX.Element {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-red-50  p-6 text-2xl text-red-500">
      <b className="">Oops!</b>
      <h4 className="">{props.children}</h4>
    </div>
  );
}
