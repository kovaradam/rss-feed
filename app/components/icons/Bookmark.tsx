import React from "react";

export function Bookmark(props: React.SVGProps<SVGSVGElement>) {
  const _id = React.useId();
  const id = props.id ?? _id;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      className={"overflow-visible ".concat(props.className ?? "")}
      id={id}
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      <path
        className="hidden sm:[button:hover_&]:block"
        fill="currentColor"
        d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
        transform="scale(0.4 0.3) translate(18 58)"
      />
    </svg>
  );
}
