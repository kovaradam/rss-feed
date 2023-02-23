import {
  ArchiveIcon,
  CogIcon,
  HomeIcon,
  LogoutIcon,
  MenuAlt2Icon,
  PlusIcon,
  UserIcon,
} from '@heroicons/react/outline';
import type { ActionFunction, LoaderArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import type { NavLinkProps } from '@remix-run/react';
import { useLocation } from '@remix-run/react';
import { Form, Link, NavLink, Outlet, useLoaderData } from '@remix-run/react';
import React from 'react';
import { AppTitle, UseAppTitle } from '~/components/AppTitle';
import { CreateChannelForm } from '~/components/CreateChannelForm';
import { ErrorMessage } from '~/components/ErrorMessage';
import { NavWrapper } from '~/components/NavWrapper';
import type {
  Channel,
  CreateFromXmlErrorType,
  Item,
} from '~/models/channel.server';
import { createChannelFromXml } from '~/models/channel.server';
import { refreshChannel, getChannels } from '~/models/channel.server';
import { getCollections } from '~/models/collection.server';
import { requireUser, requireUserId } from '~/session.server';
import { createMeta, useUser } from '~/utils';
import { NewChannelModalContext } from '~/hooks/new-channel-modal';
import { Modal } from '~/components/Modal';

export const meta = createMeta();

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const channelListItems = (await getChannels({
    where: { userId: user.id },
    select: { id: true, title: true, feedUrl: true, items: true },
    orderBy: { title: 'asc' },
  })) as (Channel & { items: Item[] })[];

  const collectionListItems = await getCollections({
    where: { userId: user.id },
    orderBy: { title: 'asc' },
  });

  const activeCollectionId = new URL(request.url).searchParams.get(
    'collection'
  );

  channelListItems.forEach(async (dbChannel) => {
    refreshChannel({ channel: dbChannel, userId: user.id })
      .then((updatedChannel) => {
        console.log('updated', updatedChannel.feedUrl);
      })
      .catch((error) => {
        console.error('update failed', error);
      });
  });

  return json({
    channelListItems,
    collectionListItems,
    activeCollectionId,
    title: 'Your feed',
  });
};

const inputNames = ['channel-url'] as const;
const [channelUrlName] = inputNames;
const errors = [...inputNames, 'xml-parse', 'create', 'fetch'] as const;

type ActionData =
  | Partial<Record<(typeof errors)[number], string | null>>
  | undefined;

export const action: ActionFunction = async ({ request }) => {
  const data = await request.formData();
  const channelHref = data.get(channelUrlName);
  const user = await requireUser(request);

  let channelUrl;
  try {
    channelUrl = new URL(String(channelHref));
  } catch (error) {
    return json<ActionData>({ [channelUrlName]: 'Provide a valid url' });
  }

  let channelRequest;
  try {
    channelRequest = await fetch(channelUrl);
  } catch (error) {
    return json<ActionData>({
      fetch: `Could not load RSS feed from "${channelUrl.origin}"`,
    });
  }

  const channelXml = await channelRequest.text();
  let newChannel;
  try {
    newChannel = await createChannelFromXml(channelXml, {
      userId: user.id,
      channelHref: channelUrl.href,
    });
  } catch (error) {
    let response: ActionData;

    switch ((error as Error).message as CreateFromXmlErrorType) {
      case 'cannotAccessDb':
        response = { create: 'Cannot save RSS feed at this moment' };
        break;
      case 'channelExists':
        response = { create: 'RSS feed already exists' };
        break;
      case 'incorrectDefinition':
        response = { 'xml-parse': 'Could not parse RSS definition' };
        break;
      default:
        response = { create: 'Could not save RSS feed' };
    }
    return json<ActionData>(response);
  }

  return redirect('/channels/'.concat(newChannel.id));
};

export default function ChannelsPage() {
  const data = useLoaderData<typeof loader>();
  const user = useUser();

  const [isNewChannelModalVisible, setIsNewChannelModalVisible] =
    React.useState(false);

  const [isNavExpanded, setIsNavExpanded] = React.useState(false);
  const [title, setTitle] = React.useState(data.title);

  const openNewChannelModal = React.useCallback(() => {
    setIsNewChannelModalVisible(true);
  }, [setIsNewChannelModalVisible]);

  const closeNewChannelModal = React.useCallback(() => {
    setIsNewChannelModalVisible(false);
  }, []);

  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname !== '/channels') {
      closeNewChannelModal();
    }
  }, [location.pathname, closeNewChannelModal]);

  return (
    <AppTitle.Context.Provider value={{ setTitle, title }}>
      <div className="flex flex-col  sm:overflow-x-visible">
        <UseAppTitle>{data.title}</UseAppTitle>
        <header className="flex w-full justify-center whitespace-nowrap border-b sm:relative sm:hidden">
          <div className="flex w-full items-center justify-between p-4 xl:w-2/3">
            <button
              onClick={() => setIsNavExpanded((prev) => !prev)}
              className="block rounded py-2  px-4 hover:bg-slate-100 active:bg-slate-200 sm:hidden"
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
          className="flex justify-center "
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
            className={`relative flex h-full min-h-screen w-screen bg-white xl:w-2/3 ${
              isNavExpanded ? 'translate-x-3/4' : ''
            } duration-200 ease-in sm:translate-x-0`}
            style={{
              boxShadow:
                '-8rem 0 5rem 0rem rgb(248 250 252 / var(--tw-bg-opacity))',
            }}
          >
            <NavWrapper
              isExpanded={isNavExpanded}
              hide={() => setIsNavExpanded(false)}
            >
              <div className="grid h-full grid-cols-1 grid-rows-[4rem_1fr_6rem]">
                <h1 className="sticky top-0 z-10 hidden truncate  bg-slate-50 p-4 font-bold sm:block sm:text-3xl">
                  <AppTitle defaultTitle={data.title} />
                </h1>
                <div className="sm:overflow-y-auto">
                  <button
                    className="m-2 flex w-[95%] items-center  gap-2 rounded p-2 text-left text-xl text-yellow-900 hover:bg-slate-100 peer-focus:hidden"
                    onClick={openNewChannelModal}
                    data-silent
                  >
                    <PlusIcon className="w-4" /> Add RSS Channel
                  </button>
                  <hr />
                  <StyledNavLink to={`/channels`} end>
                    <HomeIcon className="w-4" />
                    Feed
                  </StyledNavLink>
                  <hr />
                  <h6 className="pl-4 pt-2 text-slate-300">Collections</h6>
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
                      <Link
                        className={`m-2 flex gap-2 rounded p-2 text-xl text-slate-500 hover:bg-slate-100 hover:text-yellow-900`}
                        to={`/channels/collections/new`}
                      >
                        <PlusIcon className="w-4" />
                        New collection
                      </Link>
                    </li>
                  </ol>
                  <hr />
                  <h6 className="pl-4 pt-2 text-slate-300">Channels</h6>
                  {data.channelListItems.length === 0 ? (
                    <p className="p-4">No channels yet</p>
                  ) : (
                    <ol>
                      {data.channelListItems.map((channel) => (
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
            <div className="flex-1 p-6">
              <NewChannelModalContext.Provider
                value={React.useMemo(
                  () => ({
                    open: openNewChannelModal,
                  }),
                  [openNewChannelModal]
                )}
              >
                <Outlet />
              </NewChannelModalContext.Provider>
            </div>

            <Modal
              isOpen={isNewChannelModalVisible}
              contentLabel="New Channel"
              onRequestClose={closeNewChannelModal}
            >
              <CreateChannelForm />
            </Modal>
          </main>
        </div>
      </div>
    </AppTitle.Context.Provider>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <ErrorMessage>An unexpected error occurred: {error.message}</ErrorMessage>
  );
}

function StyledNavLink(props: NavLinkProps) {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        `m-2 flex gap-2 rounded p-2 text-lg hover:bg-slate-100 sm:text-xl ${
          isActive ? ' bg-slate-100 sm:text-yellow-900' : ''
        } ${props.className}`
      }
    >
      {props.children}
    </NavLink>
  );
}

function UserMenu(props: { user: ReturnType<typeof useUser> }) {
  return (
    <details
      className="relative flex justify-center sm:w-full sm:flex-col-reverse"
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
      <summary className="user-summary text-md flex cursor-pointer list-none items-center gap-4 rounded-md bg-white px-4 py-2 hover:bg-gray-100 active:bg-gray-200 sm:p-4 sm:shadow-md">
        <UserIcon className="pointer-events-none w-6 sm:w-[1rem] sm:min-w-[1rem] " />
        <span className="pointer-events-none hidden flex-shrink overflow-hidden text-ellipsis sm:block">
          {props.user.email}
        </span>
      </summary>
      <ul
        className="absolute right-0 z-10 flex w-[91vw] flex-col-reverse rounded-md bg-white p-2 shadow-[0_0_100vh_100vw_#00000066] sm:bottom-[110%] sm:w-full sm:flex-col sm:shadow-md"
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
      </ul>
    </details>
  );
}
