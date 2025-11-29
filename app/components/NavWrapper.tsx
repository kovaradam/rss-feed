import {
  Form,
  href,
  Link,
  NavLink,
  NavLinkProps,
  useLocation,
  useMatches,
} from "react-router";
import React from "react";

import clsx from "clsx";
import { Tooltip } from "./Tooltip";
import { ChevronUpIcon, PlusIcon } from "@heroicons/react/solid";
import { getPrefersReducedMotion } from "~/utils";
import { IncreaseTouchTarget } from "./IncreaseTouchTarget";
import {
  CogIcon,
  DotsVerticalIcon,
  KeyIcon,
  LogoutIcon,
  PencilIcon,
  UserIcon,
  XIcon,
} from "@heroicons/react/outline";
import { EditIcon } from "./icons/EditIcon";

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
        className={`absolute right-full h-full w-3/4 border-r bg-(--nav-bg) sm:relative sm:right-0 sm:block sm:h-auto sm:w-64 lg:w-80 dark:border-slate-700/50`}
        onClickCapture={(e) => {
          if (
            (e.target as HTMLElement).getAttribute("aria-current") === "page"
          ) {
            hide();
          }
        }}
        id="nav"
      >
        <div className="sticky top-0 h-svh overflow-x-hidden overflow-y-auto sm:h-screen">
          {props.children}
        </div>
      </nav>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label
        id="overlay"
        htmlFor="nav-toggle"
        aria-hidden
        className={clsx(
          `pointer-events-none absolute top-0 right-0 z-10 h-full w-full bg-blue-950 sm:hidden [input:checked+div_&]:pointer-events-auto [input:checked+div_&]:touch-none`,
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
    <div className="flex flex-col border-t p-2 dark:border-slate-700">
      {props.heading && (
        <div className="-mt-2 p-2 text-sm text-slate-600 dark:text-slate-400">
          {props.heading}
        </div>
      )}
      {props.children}
    </div>
  );
};

NavWrapper.StyledNavLink = function StyledNavLink(
  props: React.PropsWithChildren<Omit<NavLinkProps, "children">> & {},
) {
  return (
    <NavLink
      {...props}
      prefetch="intent"
      className={(state) =>
        clsx(
          state.isPending && "max-sm:bg-slate-100 max-sm:dark:bg-slate-800", // mobile pending state
          `flex gap-2 p-2 py-1 text-lg sm:text-base`,
          navInteractionStyles,
          state.isActive &&
            "bg-slate-200 text-slate-600 sm:bg-slate-200 sm:text-slate-600 dark:bg-slate-700 dark:sm:text-slate-200",
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
          <div className="pointer-events-none ml-auto flex w-4 items-center">
            {isActive && (
              <ChevronUpIcon
                className={`scroll:scale-100 w-5 transition-all not-active-scroll:scale-0!`}
                data-scroll-top-icon
              />
            )}
          </div>
        </>
      )}
    </NavLink>
  );
};

const navInteractionStyles = clsx(
  "rounded sm:hover:bg-slate-200 sm:active:bg-slate-300 dark:text-slate-100 dark:sm:hover:bg-slate-700",
);

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
      <IncreaseTouchTarget />
      <PlusIcon className="size-4" />
    </NavLink>
  );
};

NavWrapper.TitleLink = function AddEntityLink() {
  const action = NavWrapper.useEditAction();

  if (!action) return null;

  return (
    <NavLink
      className={clsx(navInteractionStyles, "relative mb-2 flex items-center")}
      aria-label={action.label}
      to={action.to}
    >
      <Tooltip position={{ x: "left", y: "top" }} />
      <PencilIcon className="size-4" />
    </NavLink>
  );
};

NavWrapper.useEditAction = function useEditAction() {
  const matches = useMatches();

  const [channelMatch, collectionMatch] = [
    "routes/channels.$channelId._index",
    "routes/channels.collections.$collectionId._index",
  ].map((id) => matches.find((match) => match.id === id));

  if (channelMatch?.params.channelId) {
    return {
      label: "Edit channel",
      to: href("/channels/:channelId/edit", {
        channelId: channelMatch.params.channelId,
      }),
    };
  }
  if (collectionMatch?.params.collectionId) {
    return {
      label: "Edit collection",
      to: href("/channels/collections/:collectionId/edit", {
        collectionId: collectionMatch.params.collectionId,
      }),
    };
  }
  return null;
};

NavWrapper.UserMenu = function UserMenu(props: {
  email: string;
  isAdmin: boolean;
}) {
  const location = useLocation();

  const editAction = NavWrapper.useEditAction();

  const actionClassName = clsx(
    "flex w-full items-center gap-4 rounded-sm p-2 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-slate-700",
  );

  return (
    <>
      <details
        key={location.pathname}
        className="peer relative flex justify-center sm:w-full sm:flex-col-reverse"
        onBlurCapture={(event) => {
          const thisElement = event.currentTarget;
          const blurTimeout = setTimeout(() => {
            thisElement.open = false;
          });
          event.currentTarget.dataset.blurTimeout = String(blurTimeout);
        }}
        onFocusCapture={(event) => {
          if (event.currentTarget.contains(event.target)) {
            clearTimeout(Number(event.currentTarget.dataset.blurTimeout));
          }
        }}
        name="nav-actions"
      >
        <summary
          className={"relative block [&::-webkit-details-marker]:hidden"}
          aria-label="Toggle menu"
        >
          <div className="text-md flex cursor-pointer items-center gap-4 rounded-md bg-white px-4 py-2 hover:bg-slate-200 sm:bg-slate-100 sm:p-4 sm:shadow-md sm:hover:bg-slate-50 sm:active:bg-slate-100 dark:bg-inherit dark:hover:bg-slate-800 dark:sm:bg-slate-700 dark:sm:hover:bg-slate-600">
            <UserIcon
              className={clsx(
                "pointer-events-none w-6 max-sm:hidden sm:w-4 sm:min-w-4",
              )}
            />

            <DotsVerticalIcon
              className={clsx("pointer-events-none w-6 sm:hidden")}
            />

            <span className="pointer-events-none hidden shrink overflow-hidden text-ellipsis sm:block">
              {props.email}
            </span>
          </div>
          <IncreaseTouchTarget />
        </summary>
        <ul
          className={clsx(
            "absolute right-2 z-20 flex w-[92vw] flex-col-reverse rounded-md bg-white p-2 shadow-md sm:right-0 sm:bottom-[110%] sm:w-full sm:flex-col dark:border dark:border-slate-500 dark:bg-slate-800 [&_hr]:my-1 [&_hr]:dark:border-slate-500",
          )}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
        >
          <noscript>
            <li>
              {/* details with the same group name to close parent details */}
              <details name="nav-actions">
                <summary
                  className={clsx(
                    "relative block [&::-webkit-details-marker]:hidden",
                    actionClassName,
                  )}
                >
                  <XIcon className="size-4" />
                  <span className="whitespace-nowrap">Close menu</span>
                </summary>
              </details>
            </li>
            <hr />
          </noscript>
          {props.isAdmin && (
            <>
              <li>
                <a href="/admin" title="Admin" className={actionClassName}>
                  <KeyIcon className="w-4" />
                  <span className="gap-4 whitespace-nowrap">Admin</span>
                </a>
              </li>
              <hr />
            </>
          )}
          <li>
            <Form action="/logout" method="post" className="w-full">
              <button type="submit" className={actionClassName}>
                <LogoutIcon className="w-4" />
                <span className="gap-4 whitespace-nowrap">Log out</span>
              </button>
            </Form>
          </li>
          <hr className="max-sm:hidden" />
          <li>
            <Link to={href("/channels/user")} className={actionClassName}>
              <CogIcon className="w-4" />

              <span className="gap-4 whitespace-nowrap">Your profile</span>
            </Link>
          </li>
          <div className="contents sm:hidden">
            <hr />
            <li>
              <Link
                to={href("/channels/collections/new")}
                className={actionClassName}
              >
                <PlusIcon className="size-4" />
                <span className="gap-4 whitespace-nowrap">
                  Create new collection
                </span>
              </Link>
            </li>
            <li>
              <Link to={href("/channels/new")} className={actionClassName}>
                <PlusIcon className="size-4" />
                <span className="gap-4 whitespace-nowrap">Add new channel</span>
              </Link>
            </li>
            {editAction && (
              <>
                <hr />
                <li>
                  <Link to={editAction.to} className={actionClassName}>
                    <EditIcon className="size-4" />
                    <span className="gap-4 whitespace-nowrap">
                      {editAction.label}
                    </span>
                  </Link>
                </li>
              </>
            )}
          </div>
        </ul>
      </details>
      <div className="invisible absolute top-0 -left-0 z-10 h-full w-full bg-blue-950 opacity-30 peer-open:visible sm:peer-open:invisible"></div>
    </>
  );
};
