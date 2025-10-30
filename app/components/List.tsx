import clsx from "clsx";
import React from "react";
import { usePreserveScroll } from "~/utils/use-preserve-scroll";

type Props<T extends "ul" | "ol" = "ul"> = React.ComponentProps<T> & { as?: T };

export function List<T extends "ul" | "ol" = "ul">({ as, ...props }: Props<T>) {
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
        className="bg-accent absolute top-0 z-10 hidden w-full scale-0 overflow-hidden rounded-b text-center text-sm text-white focus:scale-100 group-has-[:where(li,[data-li]):nth-of-type(5)]:block"
      >
        Skip to end
      </a>
      {props.children}
      <a
        aria-hidden
        href={`#${idStart}`}
        id={idEnd}
        className="bg-accent absolute bottom-0 z-10 hidden w-full scale-0 overflow-hidden rounded-t text-center text-sm text-white focus:scale-100 group-has-[:where(li,[data-li]):nth-of-type(5)]:block"
      >
        Skip to start
      </a>
    </>,
  );
}

/**
 * Prevents scroll position jump when number of items changes
 */
export function StableList<U, T extends "ul" | "ol" = "ul">({
  as,
  getKey,
  children,
  items,
  ...props
}: Omit<Props<T>, "children"> & {
  items: U[];
  children: (item: U) => React.ReactNode;
  getKey: (item: U) => React.Key;
}) {
  const anchorElementRef = React.useRef<HTMLElement>(null);

  usePreserveScroll(anchorElementRef.current, [items.length]);

  return (
    <List as={as ?? "ul"} {...props}>
      {items.map((item) => (
        <React.Fragment key={getKey(item)}>
          <div data-li>
            {children(item)}
            <ScrollAnchor onActivate={(e) => (anchorElementRef.current = e)} />
          </div>
        </React.Fragment>
      ))}
    </List>
  );
}

function ScrollAnchor(props: { onActivate: (element: HTMLElement) => void }) {
  const elementRef = React.useRef<HTMLDivElement>(null);
  const onActivate = React.useEffectEvent(props.onActivate);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onActivate(element);
          }
        });
      },
      {
        rootMargin: "-30% 0px -50% 0px",
        threshold: 1.0,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={elementRef} />;
}
