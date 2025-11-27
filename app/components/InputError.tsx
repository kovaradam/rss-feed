import { ExclamationIcon } from "@heroicons/react/solid";
import React from "react";

export function InputError(props: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={`flex items-start gap-1 pt-1 text-red-800 dark:text-red-400 ${props.className}`}
    >
      <div className="flex h-[1lh] items-center">
        <ExclamationIcon className="mt-px size-4" />
      </div>
      <p>{props.children}</p>
    </div>
  );
}
