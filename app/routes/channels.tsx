import {
  ArchiveIcon,
  ChatAltIcon,
  CogIcon,
  HomeIcon,
  KeyIcon,
  LogoutIcon,
  MenuAlt2Icon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  UserIcon,
} from "@heroicons/react/outline";
import { ChevronUpIcon } from "@heroicons/react/solid";
import React from "react";
import {
  type NavLinkProps,
  Form,
  href,
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigation,
} from "react-router";
import { AppTitle, UseAppTitle } from "~/components/AppTitle";
import { ErrorMessage } from "~/components/ErrorMessage";
import { Highlight } from "~/components/Highlight";
import { NavWrapper } from "~/components/NavWrapper";
import { Tooltip } from "~/components/Tooltip";
import { useChannelRefreshFetcher } from "~/data/useChannelRefreshFetcher";
import { getChannels } from "~/models/channel.server";
import { getCollections } from "~/models/collection.server";
import { requireUser } from "~/session.server";
import { createMeta, getPrefersReducedMotion } from "~/utils";
import type { Route } from "./+types/channels";
import { List } from "~/components/List";
import { useOnWindowFocus } from "~/utils/use-on-window-focus";
import clsx from "clsx";

export const meta = createMeta();
export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUser(request, {
    id: true,
    email: true,
    isAdmin: true,
  });
  const channels = getChannels(user.id, {
    select: { id: true, title: true },
  });

  const collectionListItems = getCollections({
    where: { userId: user.id },
    orderBy: { title: "asc" },
  });

  return {
    channels: await channels,
    collectionListItems: await collectionListItems,
    title: "Your feed",
    user,
  };
};

export default function ChannelsPage(props: Route.ComponentProps) {
  const data = props.loaderData;
  const navigation = useNavigation();

  const [title, setTitle] = React.useState(data.title as string | undefined);

  const refreshFetcher = useChannelRefreshFetcher();
  const isRefreshing = refreshFetcher.status === "pending";
  const { refresh: refreshChannels, newItemCount } = refreshFetcher;

  React.useEffect(() => {
    refreshChannels();
  }, [refreshChannels]);

  useOnWindowFocus(refreshChannels);

  const itemsContainer = globalThis.document?.body;
  const itemsContainerHeight = itemsContainer?.scrollHeight;
  React.useLayoutEffect(() => {
    if ((newItemCount ?? 0) === 0 || !itemsContainerHeight) {
      return;
    }
    if (
      window.matchMedia("(max-width: 640px)").matches &&
      document.body.style.overflowAnchor !== undefined
    ) {
      return;
    }
    const newItemsContainerHeight = itemsContainer.scrollHeight;

    const scrollingElement = document.body;

    const scrollDiff = newItemsContainerHeight - itemsContainerHeight;

    if (scrollingElement.scrollTop && scrollDiff) {
      scrollingElement.scrollTop = scrollingElement.scrollTop + scrollDiff;
    }
  }, [newItemCount, itemsContainer, itemsContainerHeight]);

  const [channelFilter, setChannelFilter] = React.useState("");

  const [isNavExpanded, setIsNavExpanded] = useNavToggleState();

  const hideNavbar = () => setIsNavExpanded(false);
  return (
    <AppTitle.Context.Provider value={{ setTitle, title }}>
      <a
        href="#main"
        className="bg-accent absolute z-10 scale-0 rounded p-1 text-white focus:scale-100"
      >
        Skip to main content
      </a>

      <input
        type="checkbox"
        id="nav-toggle"
        className="hidden"
        data-log-expanded={isNavExpanded}
      />
      <div className="flex flex-col sm:overflow-x-visible">
        <UseAppTitle>{data.title}</UseAppTitle>
        <div
          className="_background flex justify-center"
          {...registerNavSwipeCallbacks(setIsNavExpanded)}
        >
          <div
            id="nav-sliding-element"
            className={`relative flex  h-full min-h-screen w-screen duration-300 ease-in-out data-[sliding='true']:duration-0 sm:translate-x-0 sm:shadow-[-40rem_0_0rem_20rem_rgb(241,245,249)] 2xl:w-2/3 dark:shadow-[-40rem_0_0rem_20rem_rgb(2,6,23)] [input:checked+div_&]:translate-x-3/4`}
          >
            <NavWrapper isExpanded={isNavExpanded} hide={hideNavbar}>
              <div className="grid h-full grid-cols-1 grid-rows-[5rem_1fr_6rem]">
                <h1 className="sticky top-0 z-10 hidden items-end truncate  p-4 font-bold sm:flex sm:text-4xl dark:text-slate-300">
                  <span className="overflow-hidden text-ellipsis">
                    <AppTitle defaultTitle={data.title} />
                  </span>
                </h1>
                <div className="overscroll-contain sm:overflow-y-auto ">
                  <StyledNavLink
                    className={({ isActive }) =>
                      clsx(
                        isActive ? "[&]:bg-rose-500" : "sm:text-yellow-900",
                        `my-4  rounded-lg bg-rose-600 py-2 font-bold text-white shadow-lg shadow-rose-400 active:bg-rose-500 sm:h-auto sm:bg-inherit sm:py-2 sm:shadow hover:[&]:bg-rose-500 sm:[&]:hover:bg-slate-200 sm:[&]:active:bg-slate-300`
                      )
                    }
                    to={href("/channels/new")}
                  >
                    <PlusIcon className="w-4 " style={{ strokeWidth: "3px" }} />{" "}
                    Add RSS Channel
                  </StyledNavLink>
                  {[
                    {
                      to: href(`/channels`),
                      content: (
                        <>
                          {isRefreshing && !getPrefersReducedMotion() ? (
                            <div className={"relative flex items-center"}>
                              <RefreshIcon
                                className={`w-4 rotate-180 animate-spin`}
                              />
                              <Tooltip>Looking for new articles</Tooltip>
                            </div>
                          ) : (
                            <HomeIcon className="w-4" />
                          )}
                          <Tooltip>Looking for new articles</Tooltip>
                          Feed
                        </>
                      ),
                    },
                    {
                      to: href("/channels/quotes"),
                      content: (
                        <>
                          <ChatAltIcon className="w-4" />
                          Quotes
                        </>
                      ),
                    },
                  ].map((link) => (
                    <React.Fragment key={link.to}>
                      <hr className="dark:border-slate-800" />
                      <StyledNavLink to={link.to} end>
                        {link.content}
                      </StyledNavLink>
                    </React.Fragment>
                  ))}
                  <hr className="dark:border-slate-800" />
                  <h2 className="pl-4 pt-2 text-sm text-slate-600 dark:text-slate-400">
                    Collections
                  </h2>
                  <List>
                    {data.collectionListItems?.map((collection) => (
                      <li key={collection.id}>
                        <StyledNavLink
                          to={`/channels/collections/${collection.id}`}
                        >
                          <ArchiveIcon className="w-4" />
                          {collection.title}
                        </StyledNavLink>
                      </li>
                    ))}
                    <li>
                      <StyledNavLink
                        className={` hover:bg-slate-100 hover:text-yellow-900 dark:hover:text-slate-300`}
                        to={href(`/channels/collections/new`)}
                      >
                        <PlusIcon className="w-4" />
                        New collection
                      </StyledNavLink>
                    </li>
                  </List>
                  <hr className="dark:border-slate-800" />
                  <h2 className="flex justify-between gap-2 pl-4 pr-2 pt-2 text-sm text-slate-600 dark:text-slate-400">
                    Channels
                    <form
                      className="_script-only relative flex w-full items-center"
                      onSubmit={(e) => e.preventDefault()}
                    >
                      <input
                        value={channelFilter}
                        className={
                          "absolute w-full rounded-none bg-transparent px-1 pr-6 text-right accent-transparent sm:caret-slate-400 sm:outline-none sm:focus-visible:border-b sm:focus-visible:border-slate-400"
                        }
                        type="search"
                        onChange={(e) =>
                          setChannelFilter(e.currentTarget.value)
                        }
                        name="channels-filter"
                        id="channels-filter"
                      />
                      <label
                        className="absolute right-1 z-10"
                        htmlFor="channels-filter"
                        aria-label="Filter channels by name"
                      >
                        <SearchIcon className="w-4 " />
                      </label>
                    </form>
                  </h2>
                  {!data.channels || data.channels.length === 0 ? (
                    <p className="p-4 dark:text-slate-500">No channels yet</p>
                  ) : (
                    <List as="ol">
                      {data.channels
                        ?.filter((channel) =>
                          channel.title
                            .toLowerCase()
                            .includes(channelFilter.toLocaleLowerCase())
                        )
                        .map((channel) => (
                          <li key={channel.id}>
                            <StyledNavLink className="block" to={channel.id}>
                              <span className="pointer-events-none">
                                <Highlight
                                  input={channel.title}
                                  query={channelFilter}
                                />
                              </span>
                            </StyledNavLink>
                          </li>
                        ))}
                    </List>
                  )}
                </div>
                <div className="relative hidden h-full w-full items-center px-2 sm:flex ">
                  <UserMenu
                    email={data.user.email}
                    isAdmin={data.user.isAdmin}
                  />
                </div>
              </div>
            </NavWrapper>
            <div className="flex-1">
              <header className="z-10 flex w-screen justify-center whitespace-nowrap border-b bg-white sm:hidden  dark:border-b-slate-700 dark:bg-slate-900 dark:text-white">
                <div className="flex w-full items-center justify-between p-4 xl:w-2/3 ">
                  <label
                    aria-label="Toggle navigation"
                    className="block rounded px-4  py-2 hover:bg-slate-200 active:bg-slate-300 sm:hidden dark:hover:bg-slate-800"
                    htmlFor="nav-toggle"
                  >
                    <MenuAlt2Icon className="w-6" />
                  </label>
                  <h1 className="truncate font-bold sm:text-3xl">
                    <AppTitle defaultTitle={data.title} />
                  </h1>
                  <UserMenu
                    email={data.user.email}
                    isAdmin={data.user.isAdmin}
                  />
                </div>
              </header>
              <main
                id="main"
                className={`p-6 ${
                  navigation.formAction?.includes("logout")
                    ? "animate-pulse opacity-60"
                    : ""
                } `}
              >
                <Outlet />
              </main>
            </div>
          </div>
        </div>
      </div>
    </AppTitle.Context.Provider>
  );
}

export function ErrorBoundary(props: { error: Error }) {
  if (!props.error) {
    return null;
  }
  return <ErrorMessage>Something went wrong</ErrorMessage>;
}

function StyledNavLink({
  ...props
}: React.PropsWithChildren<Omit<NavLinkProps, "children">> & {}) {
  return (
    <NavLink
      {...props}
      className={(state) =>
        clsx(
          `m-2  flex gap-2 rounded p-2 py-1 text-lg hover:bg-slate-200 active:bg-slate-300 sm:text-lg dark:text-slate-300 dark:hover:bg-slate-900`,
          state.isActive &&
            " bg-slate-200 text-slate-600 sm:text-slate-600 dark:bg-slate-800 sm:[&]:bg-slate-200",
          typeof props.className === "function"
            ? props.className(state)
            : props.className
        )
      }
      onClick={(event) => {
        if (event.currentTarget.getAttribute("aria-current") === "page") {
          document.body.scrollTo({
            top: 0,
            behavior: getPrefersReducedMotion() ? "auto" : "smooth",
          });
        }
      }}
    >
      {({ isActive }) => (
        <>
          {props.children}
          <div className="ml-auto flex w-4 items-center">
            {isActive && (
              <ChevronUpIcon
                className={`active-scroll:scale-100 w-5 scale-0 transition-all`}
              />
            )}
          </div>
        </>
      )}
    </NavLink>
  );
}

function UserMenu(props: { email: string; isAdmin: boolean }) {
  const location = useLocation();
  const linkStyle =
    "text-md flex cursor-pointer items-center gap-4 rounded-md bg-white px-4 py-2 hover:bg-slate-200 sm:bg-slate-100 sm:p-4 sm:shadow-md sm:hover:bg-slate-50 sm:active:bg-slate-100 dark:bg-inherit dark:text-white dark:hover:bg-slate-800 dark:sm:bg-slate-800 dark:sm:hover:bg-slate-700";
  return (
    <>
      <noscript className="sm:flex-1">
        <a href={href("/channels/user")} className={linkStyle}>
          <UserIcon className="pointer-events-none w-6 sm:w-[1rem] sm:min-w-[1rem] " />
          <span className="pointer-events-none hidden flex-shrink overflow-hidden text-ellipsis sm:block">
            {props.email}
          </span>
        </a>
      </noscript>
      <details
        key={location.pathname}
        className="_script-only peer relative flex  justify-center sm:w-full sm:flex-col-reverse"
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
      >
        <summary
          className={`${linkStyle} [&::-webkit-details-marker]:hidden`}
          aria-label="Toggle user menu"
        >
          <UserIcon className="pointer-events-none w-6 sm:w-[1rem] sm:min-w-[1rem] " />
          <span className="pointer-events-none hidden flex-shrink overflow-hidden text-ellipsis sm:block">
            {props.email}
          </span>
        </summary>
        <ul
          className="absolute right-0 z-20 flex w-[91vw] flex-col-reverse rounded-md bg-white p-2  shadow-md sm:bottom-[110%] sm:w-full sm:flex-col dark:bg-slate-800 "
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
        >
          <li>
            <Form action="/logout" method="post" className="w-full">
              <button
                type="submit"
                className="flex w-full items-center gap-4 rounded-sm p-2 hover:bg-gray-100 active:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
              >
                <LogoutIcon className="w-4" />
                <span className="gap-4 whitespace-nowrap">Log out</span>
              </button>
            </Form>
          </li>
          <hr className="my-1" />
          <li>
            <Link
              to={href("/channels/user")}
              className="relative flex w-full items-center gap-4 rounded-sm p-2 hover:bg-gray-100 active:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
            >
              <CogIcon className="w-4" />
              <span className="gap-4 whitespace-nowrap">Profile</span>
              <Tooltip position={{ x: "left-box" }}>
                Update your profile
              </Tooltip>
            </Link>
          </li>
          {props.isAdmin && (
            <>
              <hr className="my-1" />
              <li>
                <a
                  href="/admin"
                  title="Admin"
                  className="flex w-full items-center gap-4 p-2 hover:bg-gray-100 active:bg-gray-200"
                >
                  <KeyIcon className="w-4" />
                  <span className="gap-4 whitespace-nowrap">Admin</span>
                </a>
              </li>
            </>
          )}
        </ul>
      </details>
      <div className="invisible absolute -left-0 top-0 z-10 h-full w-full bg-blue-950 opacity-30 peer-open:visible sm:peer-open:invisible"></div>
    </>
  );
}

function registerNavSwipeCallbacks(
  setIsExpanded: (value: boolean) => void
): Pick<
  React.HTMLAttributes<HTMLDivElement>,
  "onTouchStart" | "onTouchMove" | "onTouchEnd"
> {
  const getSlidingElement = () =>
    document.getElementById("nav-sliding-element");
  const getOverlayElement = () => document.getElementById("overlay");
  return {
    onTouchStart: (event) => {
      event.currentTarget.setAttribute(
        "data-touch-start-x",
        String(event.targetTouches[0]?.clientX)
      );
      event.currentTarget.setAttribute(
        "data-touch-start-y",
        String(event.targetTouches[0]?.clientY)
      );
      event.currentTarget.setAttribute("data-slide-diff", "");
    },
    onTouchMove: (event) => {
      const changedTouch = event.changedTouches[0];

      if (!changedTouch) {
        return;
      }

      const diffX =
        Number(event.currentTarget.getAttribute("data-touch-start-x")) -
        changedTouch.clientX;
      const diffY =
        Number(event.currentTarget.getAttribute("data-touch-start-y")) -
        changedTouch.clientY;

      event.currentTarget.setAttribute("data-slide-diff", String(diffX));

      const isExpanded = (
        document.getElementById("nav-toggle") as HTMLInputElement
      )?.checked;

      if (
        Math.abs(diffX) > Math.abs(diffY) &&
        (isExpanded ? diffX > 0 : diffX < 0)
      ) {
        const slidingElement = getSlidingElement();
        slidingElement?.setAttribute("data-sliding", String(true));
        slidingElement?.setAttribute(
          "style",
          `translate:${-1 * diffX}px;transition:none;`
        );

        const opacity = Math.abs(diffX / event.currentTarget.clientWidth / 5);
        getOverlayElement()?.setAttribute(
          "style",
          `--opacity:${isExpanded ? 0.1 - opacity : opacity}`
        );
      }
    },
    onTouchEnd: (event) => {
      const slidingElement = getSlidingElement();
      console.log("end", event);

      slidingElement?.setAttribute("style", "");
      getOverlayElement()?.setAttribute("style", "");
      slidingElement?.setAttribute("data-sliding", "");

      const diff = Number(event.currentTarget.getAttribute("data-slide-diff"));

      if (Math.abs(diff) >= event.currentTarget.clientWidth / 4) {
        setIsExpanded(diff < 0);
      }
    },
  };
}

function useNavToggleState() {
  const [isNavExpanded, setIsNavExpanded] = React.useState(
    globalThis.document?.querySelector("#nav-toggle:checked") !== null
  );

  React.useEffect(() => {
    const element = document.getElementById("nav-toggle");
    if (!element) {
      return;
    }
    const cb = () => {
      setIsNavExpanded((element as HTMLInputElement).checked);
    };
    element.addEventListener("change", cb);
    return () => element.removeEventListener("change", cb);
  }, []);

  return [
    isNavExpanded,
    (value: boolean) => {
      const e = document.getElementById("nav-toggle") as HTMLInputElement;
      if (e) {
        e.checked = value;
        setIsNavExpanded(e.checked); // change handler does not fire when setting checked programaticaly
      }
    },
  ] as const;
}
