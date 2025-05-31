import React from "react";
import { mapValue } from "~/utils/map-value";

type Props = {
  href: string;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

export function Href(props: Props) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`underline ${props.className}`}
      style={props.style}
    >
      {props.children ??
        mapValue(props.href)((href) =>
          href.endsWith("/") ? href.slice(0, -1) : href
        )}
    </a>
  );
}
