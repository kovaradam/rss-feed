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

  return (
    <>
      <nav
        className={`absolute right-full h-full w-3/4 border-r bg-white sm:relative sm:right-0 sm:block sm:h-auto sm:w-64 sm:bg-slate-100 lg:w-80 dark:border-r-0 dark:bg-slate-950 sm:dark:bg-slate-950`}
        onClickCapture={(e) => {
          if (
            (e.target as HTMLElement).getAttribute("aria-current") === "page"
          ) {
            hide();
          }
        }}
      >
        <div className="sticky top-0 h-[100svh] overflow-y-auto overflow-x-hidden sm:h-screen">
          {props.children}
        </div>
      </nav>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label
        id="overlay"
        htmlFor="nav-toggle"
        aria-hidden
        className={clsx(
          `pointer-events-none absolute right-0 top-0 z-10 h-full w-full bg-blue-950 sm:hidden [input:checked+div_&]:pointer-events-auto [input:checked+div_&]:touch-none`,
          "transition-opacity duration-500 [[data-sliding='true']_&]:duration-0",
          // increasing opacity on opening slide
          `opacity-[clamp(0,var(--opacity,0),0.1)]`,
          // decreasing opacity on closing slide
          `[input:checked+div_&]:opacity-[clamp(0,var(--opacity,0.1),0.1)]`
        )}
      />
    </>
  );
}
