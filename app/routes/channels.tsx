import {
  ArchiveIcon,
  CogIcon,
  HomeIcon,
  KeyIcon,
  LogoutIcon,
  MenuAlt2Icon,
  PlusIcon,
  RefreshIcon,
  UserIcon,
} from '@heroicons/react/outline';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import type { NavLinkProps } from '@remix-run/react';
import {
  Form,
  NavLink,
  Outlet,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import React from 'react';
import { AppTitle, UseAppTitle } from '~/components/AppTitle';
import { ErrorMessage } from '~/components/ErrorMessage';
import { NavWrapper } from '~/components/NavWrapper';
import { getCollections } from '~/models/collection.server';
import { requireUser } from '~/session.server';
import { createMeta, isNormalLoad, useUser } from '~/utils';
import { useChannelRefreshFetcher } from '~/hooks/useChannelFetcher';
import { getChannels } from '~/models/channel.server';

export const meta = createMeta();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUser(request);
  const channelListItems = await getChannels({
    where: { userId: user.id },
    select: { id: true, title: true, feedUrl: true, items: true },
    orderBy: { title: 'asc' },
  });

  const collectionListItems = await getCollections({
    where: { userId: user.id },
    orderBy: { title: 'asc' },
  });

  const activeCollectionId = new URL(request.url).searchParams.get(
    'collection'
  );

  return json({
    channelListItems,
    collectionListItems,
    activeCollectionId,
    title: 'Your feed',
  });
};

export default function ChannelsPage() {
  const data = useLoaderData<typeof loader>();
  const user = useUser();
  const transition = useNavigation();

  const [isNavExpanded, setIsNavExpanded] = React.useState(false);
  const [title, setTitle] = React.useState(data.title as string | undefined);

  const [load, refreshFetcher] = useChannelRefreshFetcher();
  const isRefreshing = refreshFetcher.state !== 'idle';

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <AppTitle.Context.Provider value={{ setTitle, title }}>
      <div className="flex flex-col  sm:overflow-x-visible">
        <UseAppTitle>{data.title}</UseAppTitle>
        <header className="z-10 flex w-full justify-center whitespace-nowrap border-b bg-white sm:relative sm:hidden">
          <div className="flex w-full items-center justify-between p-4 xl:w-2/3">
            <button
              onClick={() => setIsNavExpanded((prev) => !prev)}
              className="block rounded px-4  py-2 hover:bg-slate-200 active:bg-slate-300 sm:hidden"
            >
              <MenuAlt2Icon className="w-6" />
            </button>
            <h1 className="truncate font-bold sm:text-3xl">
              <AppTitle defaultTitle={data.title} />
            </h1>
            <UserMenu user={user} />
          </div>
        </header>
        <div
          className="flex justify-center bg-white"
          onTouchStart={(event) => {
            event.currentTarget.dataset.touchStartX = String(
              event.targetTouches[0]?.clientX
            );
          }}
          onTouchEnd={(event) => {
            const startX = event.currentTarget.dataset.touchStartX;

            const diff = Number(startX) - event.changedTouches[0]?.clientX;
            if (
              !startX ||
              Math.abs(diff) < event.currentTarget.clientWidth / 3
            ) {
              return;
            }
            event.preventDefault();
            setIsNavExpanded(diff < 0);
          }}
        >
          <main
            className={`relative flex h-full min-h-screen w-screen bg-white  2xl:w-2/3 ${
              isNavExpanded ? 'translate-x-3/4' : ''
            } duration-200 ease-in sm:translate-x-0`}
            style={{
              boxShadow: '-40rem 0 0rem 20rem rgb(241 245 249)',
            }}
          >
            <NavWrapper
              isExpanded={isNavExpanded}
              hide={() => setIsNavExpanded(false)}
            >
              <div className="grid h-full grid-cols-1 grid-rows-[5rem_1fr_6rem]">
                <h1 className="sticky top-0 z-10 hidden items-end truncate p-4  font-bold sm:flex sm:text-4xl">
                  <AppTitle defaultTitle={data.title} />
                </h1>
                <div className="sm:overflow-y-auto">
                  <StyledNavLink
                    className={({ isActive }) =>
                      `${
                        !isActive ? 'text-yellow-900' : ''
                      } hover:bg-slate-200 active:bg-slate-300 sm:font-bold sm:shadow`
                    }
                    to={'/channels/new'}
                  >
                    <PlusIcon className="w-4 " style={{ strokeWidth: '3px' }} />{' '}
                    Add RSS Channel
                  </StyledNavLink>
                  <hr />
                  <StyledNavLink
                    to={`/channels`}
                    end
                    title={
                      isRefreshing
                        ? 'Looking for new articles'
                        : 'Go to your feed'
                    }
                  >
                    {isRefreshing ? (
                      <RefreshIcon className={`w-4 rotate-180 animate-spin`} />
                    ) : (
                      <HomeIcon className="w-4" />
                    )}
                    Feed
                  </StyledNavLink>
                  <hr />
                  <h6 className="pl-4 pt-2 text-sm text-slate-600">
                    Collections
                  </h6>
                  <ol>
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
                        className={` hover:bg-slate-100 hover:text-yellow-900`}
                        to={`/channels/collections/new`}
                      >
                        <PlusIcon className="w-4" />
                        New collection
                      </StyledNavLink>
                    </li>
                  </ol>
                  <hr />
                  <h6 className="pl-4 pt-2 text-sm text-slate-600">Channels</h6>
                  {!data.channelListItems ||
                  data.channelListItems.length === 0 ? (
                    <p className="p-4">No channels yet</p>
                  ) : (
                    <ol>
                      {data.channelListItems?.map((channel) => (
                        <li key={channel.id}>
                          <StyledNavLink className="block" to={channel.id}>
                            {channel.title}
                          </StyledNavLink>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
                <div className="relative hidden h-full w-full items-center px-2 sm:flex ">
                  <UserMenu user={user} />
                </div>
              </div>
            </NavWrapper>
            <div
              className={`flex-1 p-6 ${
                isNormalLoad(transition) ||
                transition.formAction?.includes('logout')
                  ? 'animate-pulse opacity-60'
                  : ''
              }`}
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AppTitle.Context.Provider>
  );
}

export function ErrorBoundary(props: { error: Error }) {
  return <ErrorMessage>Something went wrong</ErrorMessage>;
}

function StyledNavLink(props: NavLinkProps) {
  return (
    <NavLink
      {...props}
      className={(state) =>
        `m-2  flex gap-2 rounded p-2 py-1 text-lg hover:bg-slate-200 sm:text-lg ${
          state.isActive ? ' bg-slate-200 text-slate-600' : ''
        } ${
          typeof props.className === 'function'
            ? props.className(state)
            : props.className
        }`
      }
    >
      {props.children}
    </NavLink>
  );
}

function UserMenu(props: { user: ReturnType<typeof useUser> }) {
  return (
    <>
      <details
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
      >
        <style>
          {/* Hide marker in safari*/}
          {'.user-summary::-webkit-details-marker {display: none}'}
        </style>

        <summary className="user-summary text-md flex cursor-pointer list-none items-center gap-4 rounded-md bg-white px-4 py-2 hover:bg-slate-200 sm:bg-slate-100 sm:p-4 sm:shadow-md sm:hover:bg-slate-50 sm:active:bg-slate-100">
          <UserIcon className="pointer-events-none w-6 sm:w-[1rem] sm:min-w-[1rem] " />
          <span className="pointer-events-none hidden flex-shrink overflow-hidden text-ellipsis sm:block">
            {props.user.email}
          </span>
        </summary>
        <ul
          className="absolute right-0 z-20 flex w-[91vw] flex-col-reverse rounded-md bg-white p-2  shadow-md sm:bottom-[110%] sm:w-full sm:flex-col"
          tabIndex={0}
        >
          <li>
            <Form action="/logout" method="post" className="w-full">
              <button
                type="submit"
                title="Log out"
                className="flex w-full items-center gap-4 p-2 hover:bg-gray-100 active:bg-gray-200"
              >
                <LogoutIcon className="w-4" />
                <span className="gap-4 whitespace-nowrap">Log out</span>
              </button>
            </Form>
          </li>
          <hr className="my-1" />
          <li>
            <a
              href="/channels/user"
              title="Update personal info"
              className="flex w-full items-center gap-4 p-2 hover:bg-gray-100 active:bg-gray-200"
            >
              <CogIcon className="w-4" />
              <span className="gap-4 whitespace-nowrap">Profile</span>
            </a>
          </li>
          {props.user.isAdmin && (
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
