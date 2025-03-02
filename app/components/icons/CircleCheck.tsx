import React from "react";

export function CircleCheck(props: React.SVGProps<SVGSVGElement>) {
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
      id={id}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4"></path>
    </svg>
  );
}
