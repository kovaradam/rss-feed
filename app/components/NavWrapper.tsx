import { useLocation } from "react-router";
import React from "react";
import { useEvent } from "~/utils/useEvent";

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
        className={`absolute right-0 top-0 z-10 hidden h-full w-full bg-black opacity-10  sm:hidden [input:checked+div_&]:flex [input:checked+div_&]:touch-none`}
      />
    </>
  );
}
