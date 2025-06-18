import clsx from "clsx";
import React from "react";

export function List<T extends "ul" | "ol" = "ul">({
  as,
  ...props
}: React.ComponentProps<T> & { as?: T }) {
  const id = React.useId();
  const idEnd = `${id}-end`,
    idStart = `${id}-start`;
  return React.createElement(
    as ?? "ul",
    { ...props, className: clsx("group relative", props.className) },
    <>
      <a
        aria-hidden
        href={`#${idEnd}`}
        id={idStart}
        className="bg-accent absolute top-0 z-10 hidden w-full scale-0 overflow-hidden rounded-b text-center text-sm text-white focus:scale-100 group-has-[li:nth-of-type(5)]:block"
      >
        Skip to end
      </a>
      {props.children}
      <a
        aria-hidden
        href={`#${idStart}`}
        id={idEnd}
        className="bg-accent absolute bottom-0 z-10 hidden w-full scale-0 overflow-hidden rounded-t text-center text-sm text-white focus:scale-100 group-has-[li:nth-of-type(5)]:block"
      >
        Skip to start
      </a>
    </>
  );
}
