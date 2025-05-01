import { ExclamationIcon } from "@heroicons/react/solid";
import React from "react";

export function InputError(props: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={`flex items-start gap-1 pt-1 text-red-800 dark:text-red-400 ${props.className}`}
    >
      <ExclamationIcon className="h-6 w-4 min-w-4" />
      {props.children}
    </div>
  );
}
