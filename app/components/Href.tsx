import React from "react";

type Props = { href: string; className?: string; children?: React.ReactNode };

export function Href(props: Props) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`underline ${props.className}`}
    >
      {props.children ?? props.href}
    </a>
  );
}
