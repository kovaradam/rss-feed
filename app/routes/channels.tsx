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

export const meta = createMeta();
export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await requireUser(request, {
    id: true,
    email: true,
    isAdmin: true,
  });
  const channels = getChannels({
    where: { userId: user.id },
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

  React.useEffect(() => {
    window.addEventListener("focus", refreshChannels);
    return () => window.removeEventListener("focus", refreshChannels);
  }, [refreshChannels]);

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

      <input type="checkbox" id="nav-toggle" className="hidden" />
      <div className="flex flex-col sm:overflow-x-visible">
        <UseAppTitle>{data.title}</UseAppTitle>
        <div
          className="background flex justify-center"
          {...registerNavSwipeCallbacks(isNavExpanded, setIsNavExpanded)}
        >
          <div
            className={`relative flex  h-full min-h-screen w-screen duration-200 ease-in sm:translate-x-0 sm:shadow-[-40rem_0_0rem_20rem_rgb(241,245,249)] 2xl:w-2/3 dark:shadow-[-40rem_0_0rem_20rem_rgb(2,6,23)] [input:checked+div_&]:translate-x-3/4`}
            data-nav-sliding-element
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
                      `${
                        !isActive ? "text-yellow-900" : ""
                      }  hover:bg-slate-200 active:bg-slate-300 sm:h-auto sm:py-2 sm:font-bold sm:shadow`
                    }
                    to={href("/channels/new")}
                    hideNavbar={hideNavbar}
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
                      <StyledNavLink to={link.to} end hideNavbar={hideNavbar}>
                        {link.content}
                      </StyledNavLink>
                    </React.Fragment>
                  ))}
                  <hr className="dark:border-slate-800" />
                  <h2 className="pl-4 pt-2 text-sm text-slate-600 dark:text-slate-400">
                    Collections
                  </h2>
                  <ol>
                    {data.collectionListItems?.map((collection) => (
                      <li key={collection.id}>
                        <StyledNavLink
                          to={`/channels/collections/${collection.id}`}
                          hideNavbar={hideNavbar}
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
                        hideNavbar={hideNavbar}
                      >
                        <PlusIcon className="w-4" />
                        New collection
                      </StyledNavLink>
                    </li>
                  </ol>
                  <hr className="dark:border-slate-800" />
                  <h2 className="flex justify-between gap-2 pl-4 pr-2 pt-2 text-sm text-slate-600 dark:text-slate-400">
                    Channels
                    <form
                      className="script-only relative flex w-full items-center"
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
                    <ol>
                      {data.channels
                        ?.filter((channel) =>
                          channel.title
                            .toLowerCase()
                            .includes(channelFilter.toLocaleLowerCase())
                        )
                        .map((channel) => (
                          <li key={channel.id}>
                            <StyledNavLink
                              className="block"
                              to={channel.id}
                              hideNavbar={() => setIsNavExpanded(false)}
                            >
                              <span className="pointer-events-none">
                                <Highlight
                                  input={channel.title}
                                  query={channelFilter}
                                />
                              </span>
                            </StyledNavLink>
                          </li>
                        ))}
                    </ol>
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
  hideNavbar,
  ...props
}: React.PropsWithChildren<Omit<NavLinkProps, "children">> & {
  hideNavbar: () => void;
}) {
  return (
    <NavLink
      {...props}
      className={(state) =>
        `m-2  flex gap-2 rounded p-2 py-1 text-lg hover:bg-slate-200 sm:text-lg dark:text-slate-300 dark:hover:bg-slate-900 ${
          state.isActive ? " bg-slate-200 text-slate-600 dark:bg-slate-800" : ""
        } ${
          typeof props.className === "function"
            ? props.className(state)
            : props.className
        }`
      }
      onClick={(event) => {
        if (event.currentTarget.getAttribute("aria-current") === "page") {
          hideNavbar();
          document.body.scrollTo({ top: 0, behavior: "smooth" });
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
        className="script-only peer relative flex  justify-center sm:w-full sm:flex-col-reverse"
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
      <div className="invisible absolute -left-0 top-0 z-10 h-full w-full  bg-black opacity-30 peer-open:visible sm:peer-open:invisible"></div>
    </>
  );
}

function registerNavSwipeCallbacks(
  isExpanded: boolean,
  setIsExpanded: (value: boolean) => void
): Pick<
  React.HTMLAttributes<HTMLDivElement>,
  "onTouchStart" | "onTouchMove" | "onTouchEnd"
> {
  return {
    onTouchStart: (event) => {
      event.currentTarget.dataset.touchStartX = String(
        event.targetTouches[0]?.clientX
      );
      event.currentTarget.dataset.touchStartY = String(
        event.targetTouches[0]?.clientY
      );
    },
    onTouchMove: (event) => {
      const changedTouch = event.changedTouches[0];
      if (!changedTouch) {
        return;
      }
      const diffX =
        Number(event.currentTarget.dataset.touchStartX) - changedTouch.clientX;
      const diffY =
        Number(event.currentTarget.dataset.touchStartY) - changedTouch.clientY;

      event.currentTarget?.setAttribute("data-slide-diff", String(diffX));

      if (
        Math.abs(diffX) > Math.abs(diffY) &&
        (isExpanded ? diffX > 0 : diffX < 0)
      ) {
        const slidingElement = event.currentTarget.querySelector(
          "[data-nav-sliding-element]"
        );
        slidingElement?.setAttribute(
          "style",
          `translate:${-1 * diffX}px;transition:none;`
        );
      }
    },
    onTouchEnd: (event) => {
      const slidingElement = event.currentTarget.querySelector(
        "[data-nav-sliding-element]"
      );

      slidingElement?.setAttribute("style", "");

      const diff = Number(event.currentTarget.getAttribute("data-slide-diff"));

      if (Math.abs(diff) < event.currentTarget.clientWidth / 4) {
        return;
      }

      setIsExpanded(diff < 0);
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
      }
    },
  ] as const;
}
