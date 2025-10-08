import clsx from "clsx";
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
      rel="noreferrer"
      className={clsx(
        `underline`,
        props.className,
        (!props.children || props.children === props.href) && "break-all",
      )}
      style={props.style}
    >
      {props.children ??
        mapValue(props.href)((href) =>
          href.endsWith("/") ? href.slice(0, -1) : href,
        )}
    </a>
  );
}
