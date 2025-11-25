import { NavLink, NavLinkProps, useLocation } from "react-router";
import React from "react";

import clsx from "clsx";
import { Tooltip } from "./Tooltip";
import { ChevronUpIcon, PlusIcon } from "@heroicons/react/solid";
import { getPrefersReducedMotion } from "~/utils";

type Props = {
  isExpanded: boolean;
  children: React.ReactNode;
  hide: () => void;
};

export function NavWrapper(props: Props) {
  const { pathname } = useLocation();
  const hide = React.useEffectEvent(() => {
    props.hide();
  });

  React.useEffect(() => {
    hide();
  }, [pathname]);

  return (
    <>
      <nav
        className={`absolute  right-full h-full w-3/4 border-r bg-(--nav-bg) sm:relative sm:right-0 sm:block sm:h-auto sm:w-64 lg:w-80 dark:border-r-0 `}
        onClickCapture={(e) => {
          if (
            (e.target as HTMLElement).getAttribute("aria-current") === "page"
          ) {
            hide();
          }
        }}
        id="nav"
      >
        <div className="sticky top-0 h-svh overflow-y-auto overflow-x-hidden sm:h-screen">
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
          "transition-opacity duration-500 in-data-[sliding='true']:duration-0",
          // increasing opacity on opening slide
          `opacity-[clamp(0,var(--opacity,0),0.1)]`,
          // decreasing opacity on closing slide
          `[input:checked+div_&]:opacity-[clamp(0,var(--opacity,0.1),0.1)]`,
        )}
      />
    </>
  );
}

NavWrapper.NavSection = function NavSection(
  props: React.PropsWithChildren & { heading?: React.ReactNode },
) {
  return (
    <div className="p-2 border-t dark:border-slate-800 flex flex-col">
      {props.heading && (
        <div className="text-sm text-slate-600 dark:text-slate-400 -mt-2 p-2 ">
          {props.heading}
        </div>
      )}
      {props.children}
    </div>
  );
};

NavWrapper.StyledNavLink = function StyledNavLink({
  ...props
}: React.PropsWithChildren<Omit<NavLinkProps, "children">> & {}) {
  return (
    <NavLink
      {...props}
      prefetch="intent"
      className={(state) =>
        clsx(
          state.isPending && "max-sm:bg-slate-100 max-sm:dark:bg-slate-800", // mobile pending state
          `flex gap-2 p-2 py-1 text-lg sm:text-lg`,
          navInteractionStyles,
          state.isActive &&
            " bg-slate-200 text-slate-600 sm:bg-slate-200 sm:text-slate-600 dark:bg-slate-800",
          typeof props.className === "function"
            ? props.className(state)
            : props.className,
        )
      }
      onClick={(event) => {
        if (event.currentTarget.getAttribute("aria-current") === "page") {
          // safari hack
          setTimeout(() => {
            document.body.scrollTo({
              top: 0,
              behavior: getPrefersReducedMotion() ? "auto" : "smooth",
            });
          }, 10);
        }
      }}
    >
      {({ isActive }) => (
        <>
          {props.children}
          <div className="ml-auto flex w-4 items-center">
            {isActive && (
              <ChevronUpIcon
                className={`scroll:scale-100 w-5 not-active-scroll:scale-0! transition-all`}
                data-scroll-top-icon
              />
            )}
          </div>
        </>
      )}
    </NavLink>
  );
};

const navInteractionStyles =
  "sm:hover:bg-slate-200 rounded sm:active:bg-slate-300 dark:text-slate-300 dark:hover:bg-slate-900";

NavWrapper.AddEntityLink = function AddEntityLink(props: {
  to: string;
  label: string;
}) {
  return (
    <NavLink
      className={clsx(navInteractionStyles, "relative flex items-center")}
      aria-label={props.label}
      to={props.to}
    >
      <Tooltip position={{ x: "left" }} />
      <span className="absolute inset-0 scale-200 pointer-fine:hidden" />
      <PlusIcon className="size-4" />
    </NavLink>
  );
};
