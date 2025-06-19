import { useLocation } from "react-router";
import React from "react";
import { useEvent } from "~/utils/useEvent";
import clsx from "clsx";

type Props = {
  isExpanded: boolean;
  children: React.ReactNode;
  hide: () => void;
};

export function NavWrapper(props: Props) {
  const { pathname } = useLocation();
  const hide = useEvent(() => {
    props.hide();
  });

  React.useEffect(() => {
    hide();
  }, [pathname, hide]);

  const scrollElementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (props.isExpanded) {
      scrollElementRef.current?.scroll({ top: 0 });
    }
  }, [props.isExpanded]);

  return (
    <>
      <nav
        className={`absolute right-full h-full w-3/4 border-r bg-white sm:relative sm:right-0 sm:block sm:h-auto sm:w-64 sm:bg-slate-100 lg:w-80 dark:border-r-0 dark:bg-slate-950 sm:dark:bg-slate-950`}
      >
        <div
          className="sticky top-0 h-[100svh] overflow-y-auto overflow-x-hidden overscroll-y-none sm:h-screen"
          ref={scrollElementRef}
        >
          {props.children}
        </div>
      </nav>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label
        htmlFor="nav-toggle"
        aria-hidden
        className={clsx(
          `pointer-events-none absolute right-0 top-0 z-10 h-full w-full bg-black transition-opacity sm:hidden [input:checked+div_&]:pointer-events-auto [input:checked+div_&]:touch-none`,
          // increasing opacity on opening slide
          `opacity-[clamp(0,calc(var(--slide-rate,0)/5),0.1)]`,
          // decreasing opacity on closing slide
          `[input:checked+div_&]:opacity-[clamp(0,calc((1-var(--slide-rate,-1))*0.1),0.1)]`
        )}
      />
    </>
  );
}
